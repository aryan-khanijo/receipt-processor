/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('receipt_file', table => {
            table.increments('id').primary();
            table.string('file_name').notNullable();
            table.string('file_path').notNullable();
            table.boolean('is_valid').defaultTo(false);
            table.string('invalid_reason');
            table.boolean('is_processed').defaultTo(false);
            table.timestamps(true, true);
        })
        .createTable('receipt', table => {
            table.increments('id').primary();
            table.timestamp('purchased_at');
            table.string('merchant_name');
            table.decimal('total_amount', 10, 2);
            table.decimal('tax_amount', 10, 2);
            table.string('currency', 10).defaultTo('USD');
            table.string('file_path');
            table.timestamps(true, true);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('receipt')
        .dropTableIfExists('receipt_file');
};
