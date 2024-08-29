import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as ejs from 'ejs';
import { createPrompt, isEnterKey, useEffect, useKeypress, useState } from '@inquirer/core';

import { Context } from 'vm';
import { ProjectOptions, TemplateData, Config, Choice } from './types';

export function createProject(options: ProjectOptions) {
  if (fs.existsSync(options.projectPath)) {
    console.log(chalk.red(`Folder ${options.projectPath} exists`));
    return false;
  }

  fs.mkdirSync(options.projectPath);
  return true;
}
export function createContents({ ignoreFileName, templatePath, projectPath, projectName }: ProjectOptions) {
  const ignore: Set<string> = new Set(['node_modules', ignoreFileName]);
  const ignoreFile = resolve(templatePath, ignoreFileName);

  if (fs.existsSync(ignoreFile)) {
    fs.readFileSync(ignoreFile, { encoding: 'utf8' })
      .split('\n')
      .forEach((line) => ignore.add(line.replace(/\r$/, '')));
  }

  const files = fs.readdirSync(templatePath, { recursive: true });

  for (let file of files) {
    if ([...ignore].some((ignoreFile) => file.toString().match(ignoreFile))) continue;

    const templateFile = resolve(templatePath, file.toString());
    const destFile = resolve(projectPath, file.toString());
    const stats = fs.statSync(templateFile);

    if (stats.isDirectory()) {
      fs.mkdirSync(destFile);
    }
    if (stats.isFile()) {
      let readFile = fs.readFileSync(templateFile, { encoding: 'utf8' });
      readFile = render(readFile, {
        projectName,
      });
      fs.writeFileSync(destFile, readFile, { encoding: 'utf8' });
    }
  }
}
export function resolve(...paths: string[]) {
  return path.resolve(process.cwd(), ...paths);
}
function render(content: string, data: TemplateData) {
  return ejs.render(content, data);
}

export const list = <Value, T extends Choice = { name: string; value: string }>(
  config: Config<Value, T>,
  context?: Context
) =>
  createPrompt<Value, Config<Value, T>>((config, done) => {
    const [index, setIndex] = useState(0);
    const prefix = config.prefix ?? '?';
    const suffix = config.suffix ?? '';
    useKeypress((key) => {
      if (isEnterKey(key)) {
        return done(getValue());
      }
      switch (key.name) {
        case 'down':
          setIndex(
            config.nowrap
              ? Math.max(index + 1, config.choices.length - 1)
              : index + 1 >= config.choices.length
              ? 0
              : index + 1
          );
          break;
        case 'up':
          setIndex(config.nowrap ? Math.max(index - 1, 0) : index - 1 < 0 ? config.choices.length - 1 : index - 1);
          break;
      }
    });
    useEffect(() => {
      if (config.resolveOnValue) {
        const choice =
          typeof config.resolveOnValue === 'function'
            ? config.resolveOnValue(config.choices, config.transformer)
            : config.resolveOnValue;
        if (choice !== null) {
          const value = typeof choice === 'string' ? choice : choice.value ?? choice.name;
          console.clear();
          done(config.resolve ? config.resolve(choice) : (value as Value));
        }
      }
    }, []);

    function getValue(i?: number) {
      const item = config.choices[i && i >= 0 && i < config.choices.length ? i : index];
      const formattedItem = config.transformer ? config.transformer(item) : item;
      const value = typeof formattedItem === 'string' ? formattedItem : formattedItem.value ?? formattedItem.name;
      return config.resolve ? config.resolve(formattedItem) : (value as Value);
    }
    return (
      chalk.green(prefix) +
      ' ' +
      chalk.whiteBright.bold(config.message + suffix) +
      config.choices.reduce((str, item, i) => {
        const formattedItem = config.transformer ? config.transformer(item) : item;
        const newItem = typeof formattedItem === 'string' ? formattedItem : formattedItem.name;

        const selected = i === index;
        const currentIndex = config.orderedList ? `${i + 1}.` : '-';
        const value = currentIndex + ' ' + newItem;
        return (str +=
          ' '.repeat(prefix.length + 1) +
          (selected ? chalk.blue(value) : value) +
          (i < config.choices.length - 1 ? '\n' : ''));
      }, '\n')
    );
  })(config, context);
