import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
} from '@grafana/data';
import { range } from 'lodash';

const versionsByBrowser: Record<string, string[]> = {
  Firefox: range(5, 109).map((value) => value.toString()),
  Chrome: range(90, 104).map((value) => value.toString()),
  Edge: range(80, 105).map((value) => value.toString()),
  Safari: range(1, 15).map((value) => value.toString()),
};

const browsersByVersion: Record<string, string[]> = {};
Object.keys(versionsByBrowser).forEach((browser) => {
  versionsByBrowser[browser].forEach((version) => {
    browsersByVersion[version] = browsersByVersion[version] ?? [];
    browsersByVersion[version].push(browser);
  });
});

async function getOptions(type: string, filter: string[]) {
  const map =
    {
      version: browsersByVersion,
      browser: versionsByBrowser,
    }[type] ?? {};
  return Object.keys(map).filter((key) => filter.every((value) => map[key].includes(value)));
}

function includeAll(values: string[]) {
  return values.includes('$__all') ? [] : values;
}

export class DataSource extends DataSourceApi<any, any> {
  constructor(instanceSettings: DataSourceInstanceSettings<any>, private templateSrv: any) {
    super(instanceSettings);
  }

  getVariable(definition: string) {
    return this.templateSrv.getVariables().find((variable: any) => variable.definition === definition);
  }

  onChangeVariable(changedVariable: any) {
    if (changedVariable.definition !== 'browser' && changedVariable.definition !== 'version') {
      return;
    }

    // To keep this example focused on what matters the relationship between browser/version is hard-coded.
    this.templateSrv.reevaluateVariable(
      this.getVariable(changedVariable.definition === 'browser' ? 'version' : 'browser')
    );
  }

  async metricFindQuery(query: string): Promise<MetricFindValue[]> {
    const filter = includeAll(this.getVariable(query === 'browser' ? 'version' : 'browser')?.current?.value ?? []);
    const options = await getOptions(query, filter);
    return options.map((value) => ({ text: value, value }));
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
