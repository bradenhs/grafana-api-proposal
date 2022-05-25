import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
  VariableModel,
} from '@grafana/data';

import { range } from 'lodash';

const versionsByBrowser: Record<string, number[]> = {
  Firefox: range(5, 109),
  Chrome: range(90, 104),
  Edge: range(80, 105),
  Safari: range(1, 15),
};

const browsersByVersion: Record<number, string[]> = {};

Object.keys(versionsByBrowser).forEach((browser) => {
  versionsByBrowser[browser].forEach((version) => {
    browsersByVersion[version] = browsersByVersion[version] ?? [];
    browsersByVersion[version].push(browser);
  });
});

const allBrowsers = Object.keys(versionsByBrowser);
const allVersions = Object.keys(browsersByVersion).map((value) => parseInt(value));

export async function getBrowserVersionOptions(browsers: string[], versions: number[]) {
  return {
    browserOptions: allBrowsers.filter((browser) =>
      versions.every((version) => versionsByBrowser[browser].includes(version))
    ),
    versionOptions: allVersions.filter((version) =>
      browsers.every((browser) => browsersByVersion[version].includes(browser))
    ),
  };
}

function includeAll(values: string[]) {
  if (values.includes('$__all')) {
    return [];
  } else {
    return values;
  }
}

export class DataSource extends DataSourceApi<any, any> {
  constructor(instanceSettings: DataSourceInstanceSettings<any>, private templateSrv: any) {
    super(instanceSettings);
  }

  optionsOperation = getBrowserVersionOptions([], []);

  onChangeVariable(changedVariable: VariableModel & { definition: string }) {
    if (changedVariable.definition !== 'browser' && changedVariable.definition !== 'version') {
      return;
    }

    const variables = this.templateSrv.getVariables();
    const browserVariable = variables.find((variable: any) => variable.definition === 'browser');
    const versionVariable = variables.find((variable: any) => variable.definition === 'version');

    this.optionsOperation = getBrowserVersionOptions(
      includeAll(browserVariable?.current?.value ?? []),
      includeAll(versionVariable?.current?.value ?? []).map((version: string) => parseInt(version))
    );

    if (changedVariable.definition === 'browser') {
      this.templateSrv.reevaluateVariable(versionVariable);
    } else {
      this.templateSrv.reevaluateVariable(browserVariable);
    }
  }

  async metricFindQuery(query: string): Promise<MetricFindValue[]> {
    const options = await this.optionsOperation;

    if (query === 'version') {
      return options.versionOptions.map((version) => {
        return {
          text: version.toString(),
          value: version,
        };
      });
    }

    if (query === 'browser') {
      return options.browserOptions.map((browser) => {
        return {
          text: browser,
          value: browser,
        };
      });
    }

    return [];
  }

  async query(_: DataQueryRequest<any>): Promise<DataQueryResponse> {
    return { data: [] };
  }

  async testDatasource() {
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
