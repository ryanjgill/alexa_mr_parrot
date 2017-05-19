/**
 * Build Response with Names
 * :items - Array
 * --> returns numbered list of items and the items name
 */

module.exports = items => items.map((item, index) => `${index+1}: ${item.name}`).join(', ');