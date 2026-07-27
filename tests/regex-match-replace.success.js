const fs = require('fs');
const path = require('path');
const mr = require('azure-pipelines-task-lib/mock-run');

const providedTempDir = process.env.TASK_TEST_TEMP_DIR;
const tempDir = providedTempDir || path.join(__dirname, '.tmp');
const sampleFilePath = path.join(tempDir, 'sample.txt');
const taskPath = path.join(
  __dirname,
  '..',
  'dist',
  'BuildTask',
  'RegexMatchReplace',
  'regexMatchReplace.js'
);

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(sampleFilePath)) {
  fs.writeFileSync(sampleFilePath, 'version=1.2.3', 'utf8');
}

const taskRunner = new mr.TaskMockRunner(taskPath);
taskRunner.setInput('PathToFile', '**/*.txt');
taskRunner.setInput('WorkingDirectory', tempDir);
taskRunner.setInput('RegEx', '\\d+\\.\\d+\\.\\d+');
taskRunner.setInput('ValueToReplace', '9.9.9');
taskRunner.setInput('Global', 'true');
taskRunner.setInput('IgnoreCase', 'false');
taskRunner.setInput('MultiLine', 'false');
taskRunner.run();
