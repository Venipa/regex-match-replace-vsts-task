const fs = require('fs');
const os = require('os');
const path = require('path');
const ttm = require('azure-pipelines-task-lib/mock-test');

const testEntryPath = path.join(__dirname, 'regex-match-replace.success.js');
const taskJsonPath = path.join(
  __dirname,
  '..',
  'dist',
  'BuildTask',
  'RegexMatchReplace',
  'task.json'
);

describe('regex match replace task', () => {
  it('creates sample input and replaces semantic version text', async () => {
    const uniqueTempDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'regex-match-replace-test-')
    );
    const sampleFilePath = path.join(uniqueTempDirectory, 'sample.txt');
    fs.writeFileSync(sampleFilePath, 'version=1.2.3', 'utf8');

    const previousTempDirectory = process.env.TASK_TEST_TEMP_DIR;
    process.env.TASK_TEST_TEMP_DIR = uniqueTempDirectory;

    try {
      const testRunner = new ttm.MockTestRunner(testEntryPath, taskJsonPath);
      await testRunner.runAsync();

      expect(testRunner.succeeded).toBe(true);
      expect(testRunner.stdout).toContain('Modified 1 files');

      const updatedContent = fs.readFileSync(sampleFilePath, 'utf8');
      expect(updatedContent).toBe('version=9.9.9');
    } finally {
      if (previousTempDirectory === undefined) {
        delete process.env.TASK_TEST_TEMP_DIR;
      } else {
        process.env.TASK_TEST_TEMP_DIR = previousTempDirectory;
      }
      fs.rmSync(uniqueTempDirectory, { recursive: true, force: true });
    }
  });
});
