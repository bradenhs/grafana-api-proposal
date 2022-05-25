import { PureComponent } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';

type Props = QueryEditorProps<DataSource, any, any>;

export class QueryEditor extends PureComponent<Props> {
  render() {
    return null;
  }
}
