import { withDb } from "../../db/pool.js";
import type { Operation } from "../../types/domain.js";

type OperationRow = {
  operation_ref: string;
  name: string | null;
  connector: string | null;
  module_path: string;
  auth_strategy: string;
  description: string | null;
  input_schema: Operation["inputSchema"] | null;
  output_schema: Operation["outputSchema"] | null;
  tags: string[] | null;
};

const mapOperation = (row: OperationRow): Operation => ({
  operationRef: row.operation_ref,
  modulePath: row.module_path,
  authStrategy: row.auth_strategy,
  ...(row.connector ? { connector: row.connector } : {}),
  name: row.name ?? row.operation_ref,
  ...(row.description ? { description: row.description } : {}),
  tags: row.tags ?? [],
  ...(row.input_schema ? { inputSchema: row.input_schema } : {}),
  ...(row.output_schema ? { outputSchema: row.output_schema } : {}),
});

export const listOperations = async (): Promise<Operation[]> => {
  return withDb(async (client) => {
    const result = await client.query<OperationRow>(
      `select operation_ref, name, connector, module_path, auth_strategy, description, input_schema, output_schema, tags
       from operations
       order by operation_ref asc`,
    );

    return result.rows.map(mapOperation);
  });
};

export const findOperationByRef = async (operationRef: string): Promise<Operation | null> => {
  return withDb(async (client) => {
    const result = await client.query<OperationRow>(
      `select operation_ref, name, connector, module_path, auth_strategy, description, input_schema, output_schema, tags
       from operations
       where operation_ref = $1
       limit 1`,
      [operationRef],
    );

    const row = result.rows[0];
    return row ? mapOperation(row) : null;
  });
};
