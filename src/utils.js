/**
 * This file is intended to create useful and testable functions for the project.
 */
import { get, has } from 'object-path';

/**
 * List all matching object paths by using a simple string.
 * 
 * Examples:
 * 
 * object = {
 *   a: {
 *     b: {
 *       c: 'first'
 *     },
 *     c: {
 *       c: 'second'
 *     }
 *   }
 * }
 * 
 * findObjectPaths(object, 'a.b.c') => [ 'a.b.c' ]
 * findObjectPaths(object, 'a.*.c') => [ 'a.b.c', 'a.c.c' ]
 * findObjectPaths(object, 'a.b,c|a.c.*') => [ 'a.b', 'a.c', 'a.c.c' ]
 * 
 * @param {object} object Object to search through
 * @param {string} schema Filter to select what to return from object
 */
export const findObjectPaths = (object, schema = '') => {

    // Check if a "|" is in the schema. If found, then split by "|"
    // and run findObjectPaths function over them again and avoid
    // duplicates.
    if (schema.indexOf('|') !== -1) {
        let results = [];
        for (let part of schema.split('|')) {
            let result = findObjectPaths(object, part);
            for (let path of result) {
                if (results.indexOf(path) === -1) {
                    results.push(path);
                }
            }
        }

        return results;
    }

    // If no splits, "|", are occurring, do a search
    let keys = schema.split('.');
    let results = [[]];

    // Go through each key
    for (let key of keys) {
        let newResults = [];

        // Search through all matches in object at current depth
        if (key === '*') {
            for (let index in results) {
                let path = results[index];
                if (has(object, path)) {
                    for (let next in get(object, path)) {
                        newResults.push(path.concat(next));
                    }
                }
            }
        }

        // If there are finite possibilities we know the
        // paths to search through.
        else {
            for (let option of key.split(',')) {
                for (let index in results) {
                    let path = results[index].concat([option]);
                    if (has(object, path)) {
                        newResults.push(path);
                    }
                }
            }
        }

        results = newResults;
    }

    return results.map(result => result.join('.'));
}
