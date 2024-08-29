#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from '@inquirer/prompts';
import yargs from 'yargs';

import { createProject, createContents, list, resolve } from './utils';

import { ProjectOptions } from './types';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));

async function init() {
  const args = yargs(process.argv).argv;
  const { template, name } = args as Record<string, string | undefined>;

  console.clear();
  const projectName = name ? name : await inquirer.input({ message: 'Project name:', required: true });
  const project = await list<ProjectOptions>({
    message: 'Choose project to generate:',
    choices: CHOICES.map((v) => ({ value: v, name: v })),
    transformer(choice) {
      return {
        ...choice,
        name: choice.name
          .split('-')
          .map((v) => v[0].toUpperCase() + v.substring(1))
          .join(' '),
      };
    },
    resolve(choice) {
      return {
        templatePath: resolve(__dirname, 'templates', choice.value),
        projectPath: path.resolve(process.cwd(), projectName),
        ignoreFileName: '.ignore',
        projectName,
      };
    },
    resolveOnValue: template
      ? {
          name: template,
          value: template,
        }
      : null,
  });

  if (!createProject(project)) {
    return;
  }

  createContents(project);
}

init();
