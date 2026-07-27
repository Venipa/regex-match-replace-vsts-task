import fg = require('fast-glob');
import * as fs from 'fs';
import * as path from 'path';
import * as Task from 'azure-pipelines-task-lib/task';

import { RegExMatch } from './regExMatch';

Task.setResourcePath(path.join(__dirname, 'task.json'));

function readFileAsync(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (error, data) => {
      if (error) {
        return reject(error);
      }
      return resolve(data);
    });
  });
}

function writeFileAsync(filePath: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf8', (error) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

async function globFilesByPattern(
  pattern: string,
  cwd: string | undefined
): Promise<string[]> {
  return fg.async(pattern, {
    cwd,
    absolute: true,
    onlyFiles: true,
    unique: true
  });
}

async function run(): Promise<void> {

  const filePath: string = Task.getInput('PathToFile', true)!;
  const regExString: string = Task.getInput('RegEx', true)!;
  const valueToReplace: string = Task.getInput('ValueToReplace', true)!;
  const global: boolean = Task.getBoolInput('Global');
  const ignoreCase: boolean = Task.getBoolInput('IgnoreCase');
  const multiLine: boolean = Task.getBoolInput('MultiLine');
  const workingDirectory: string | undefined = Task.getPathInput('WorkingDirectory');
  const effectiveWorkingDirectory: string | undefined = workingDirectory
    && workingDirectory.trim().length > 0
    ? workingDirectory
    : undefined;

  Task.debug(`File path: ${filePath}`);
  Task.debug(`Regular Expression: ${regExString}`);
  Task.debug(`Replacement Value: ${valueToReplace}`);
  Task.debug(`Working Directory: ${effectiveWorkingDirectory}`);
  const filePatterns = filePath
    .split(/\r?\n/)
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length > 0);

  if (filePatterns.length === 0) {
    Task.setResult(
      Task.TaskResult.SucceededWithIssues,
      'No files have been modified. No valid file path pattern found.'
    );
    return;
  }

  let filesByPattern: string[][];
  try {
    filesByPattern = await Promise.all(
      filePatterns.map((pattern) => globFilesByPattern(pattern, effectiveWorkingDirectory))
    );
  } catch (error) {
    Task.setResult(
      Task.TaskResult.Failed,
      `Something went wrong with your filepath pattern(s). File path: ${filePath}`
    );
    return;
  }

  const files = Array.from(new Set(
    filesByPattern.reduce((acc, current) => acc.concat(current), [] as string[])
  ));

  if (files.length > 0) {
    const filesToProcess = files.map((file) => {
      Task.debug(`File has been found: ${file}`);
      return file;
    });

    let modifiedFiles: string[];
    try {
      modifiedFiles = await Promise.all(
        filesToProcess.map(async (fileToProcess) => {
          const data = await readFileAsync(fileToProcess);
          const modifiedContent = RegExMatch.MatchAndReplace(
            data,
            regExString,
            valueToReplace,
            global,
            ignoreCase,
            multiLine
          );
          await writeFileAsync(fileToProcess, modifiedContent);
          Task.debug(`File has been modified: ${fileToProcess}`);
          return fileToProcess;
        })
      );
    } catch (error) {
      Task.setResult(
        Task.TaskResult.Failed,
        `Something went wrong while replacing file content. File path: ${filePath}`
      );
      return;
    }

    Task.setResult(
      Task.TaskResult.Succeeded,
      `Modified ${modifiedFiles.length} files`
    );
    return;
  }

  Task.setResult(
    Task.TaskResult.SucceededWithIssues,
    `No files have been modified. File path: ${filePath}`
  );
}

run().catch((err: any) => {
  if (err) Task.debug(err);
});
