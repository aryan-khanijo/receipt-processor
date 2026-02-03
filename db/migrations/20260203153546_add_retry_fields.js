/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('receipt_file', table => {
        table.string('status').defaultTo('pending'); // pending, processing, completed, failed, queued
        table.integer('retry_count').defaultTo(0);
        table.text('last_error');
    });
};

exports.down = function (knex) {
    return knex.schema.table('receipt_file', table => {
        table.dropColumn('status');
        table.dropColumn('retry_count');
        table.dropColumn('last_error');
    });
};
