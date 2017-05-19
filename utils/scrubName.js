/**
 * Scrub Name
 * :name - String
 * Returns string without special characters all slammed together
 * and lower case.
 */

module.exports = name => name.replace(/[^\w\s]/gi, '').split(' ').join('').toLowerCase();