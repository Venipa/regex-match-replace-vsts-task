import * as Task from 'vsts-task-lib';
import * as path from 'path';
import * as fs from 'fs';
import * as sentry from '@sentry/node';
import { glob } from 'glob';

import { RegExMatch } from './regExMatch';

Task.setResourcePath(path.join(__dirname, 'task.json'));

async function run(): Promise<void> {
  sentry.init({
    dsn: 'SENTRY_DSN',
    release: 'TASK_RELEASE_VERSION'
  });

  const filePath: string = Task.getPathInput('PathToFile', true);
  const regExString: string = Task.getInput('RegEx', true);
  const valueToReplace: string = Task.getInput('ValueToReplace', true);
  const global: boolean = Task.getBoolInput('Global');
  const ignoreCase: boolean = Task.getBoolInput('IgnoreCase');
  const multiLine: boolean = Task.getBoolInput('MultiLine');
  const workingDirectory: string = Task.getPathInput('WorkingDirectory');

  Task.debug(`File path: ${filePath}`);
  Task.debug(`Regular Expression: ${regExString}`);
  Task.debug(`Replacement Value: ${valueToReplace}`);
  return await new Promise((resolve, reject) => {
    glob(
      filePath,
      {
        cwd: workingDirectory === '' ? undefined : workingDirectory
      },
      (globError, files) => {
        if (globError) {
          Task.setResult(
            Task.TaskResult.Failed,
            `Something went wrong with your filepath pattern. File path: ${filePath}`
          );
          return reject();
        }
        if (files.length > 0) {
          const operations = files.map((file) => {
            Task.debug(`File has been found: ${file}`);
            return () =>
              new Promise<string>((fresolve, freject) => {
                fs.readFile(file, 'utf8', (readError, data) => {
                  if (readError) {
                    return freject(readError);
                  }
                  // Match and Replace
                  const modifiedContent = RegExMatch.MatchAndReplace(
                    data,
                    regExString,
                    valueToReplace,
                    global,
                    ignoreCase,
                    multiLine
                  );

                  fs.writeFile(file, modifiedContent, 'utf8', (writeError) => {
                    if (writeError) {
                      sentry.captureException(writeError);
                      return freject(writeError);
                    }
                    return fresolve(file);
                  });
                });
              });
          });
          const modifiedFiles = [];
          return Promise.all(
            operations.map(async (operation) => {
              const file = await operation();
              Task.debug(`File has been modified: ${file}`);
              modifiedFiles.push(file);
            })
          )
            .then(() =>
              Task.setResult(
                Task.TaskResult.Succeeded,
                `Modified ${modifiedFiles.length} files`
              )
            )
            .then(resolve)
            .catch(reject);
        } else {
          Task.setResult(
            Task.TaskResult.SucceededWithIssues,
            `No files have been modified. File path: ${filePath}`
          );
          resolve();
        }
      }
    );
  });
}

run().catch((err: any) => {
  if (err) sentry.captureException(err);
});
