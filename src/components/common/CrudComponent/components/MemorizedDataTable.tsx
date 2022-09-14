import * as React from 'react'
import { DataTable, IDataTableProps } from 'uxp/components'

const MemorizedDataTable: React.FunctionComponent<IDataTableProps> = (props) => {
    return <DataTable {...props} />
}

export default React.memo(MemorizedDataTable)