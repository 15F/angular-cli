/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  apply,
  branchAndMerge,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  template,
  url,
} from '@angular-devkit/schematics';
import { applyLintFix } from '../utility/lint-fix';
import { parseName } from '../utility/parse-name';
import { buildDefaultPath, getProject } from '../utility/project';
import { Schema as ClassOptions } from './schema';

export default function (options: ClassOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (!options.project) {
      throw new SchematicsException('Option (project) is required.');
    }

    const project = getProject(host, options.project);

    if (options.path === undefined) {
      options.path = buildDefaultPath(project);
    }

    options.type = !!options.type ? `.${options.type}` : '';

    const parsedPath = parseName(options.path, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    // todo remove these when we remove the deprecations
    options.skipTests = options.skipTests || !options.spec;

    const templateSource = apply(url('./files'), [
      options.skipTests ? filter(path => !path.endsWith('.spec.ts')) : noop(),
      template({
        ...strings,
        ...options,
      }),
      move(parsedPath.path),
    ]);

    return chain([
      branchAndMerge(mergeWith(templateSource)),
      options.lintFix ? applyLintFix(options.path) : noop(),
    ]);
  };
}
