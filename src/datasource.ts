import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
} from '@grafana/data';
import { locationService, TemplateSrv } from '@grafana/runtime';
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
      'Browsers($Version)': browsersByVersion,
      'Versions($Browser)': versionsByBrowser,
    }[type] ?? {};
  return Object.keys(map).filter((key) => filter.every((value) => map[key].includes(value)));
}

export class DataSource extends DataSourceApi<any, any> {
  constructor(instanceSettings: DataSourceInstanceSettings<any>, private templateSrv: TemplateSrv) {
    super(instanceSettings);
  }

  getVariable(definition: string) {
    return this.templateSrv.getVariables().find((variable: any) => variable.definition === definition) as any;
  }

  getVariableValue(definition: string) {
    const variable = this.getVariable(definition);

    if (variable === undefined) {
      return [];
    }

    // This is necessary to retrieve the initial value b/c variable.current isn't set when metricFindQuery is first called
    let locationValue = (locationService.getSearchObject()[`var-${variable.name}`] ?? []) as string[] | string;
    if (locationValue === 'All') {
      locationValue = [];
    } else if (!Array.isArray(locationValue)) {
      locationValue = [locationValue];
    }

    const rawValue: string[] = variable?.current?.value ?? locationValue;

    const normalizedValue = (rawValue.includes('$__all') ? [] : rawValue).filter((value) => value.length > 0);

    return normalizedValue;
  }

  async metricFindQuery(query: string): Promise<MetricFindValue[]> {
    const filter = this.getVariableValue(query === 'Browsers($Version)' ? 'Versions($Browser)' : 'Browsers($Version)');
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
