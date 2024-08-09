import * as fs from 'node:fs/promises';
import * as fileSystem from 'node:fs';
import * as path from 'node:path';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import {
  errorMessages,
  commandConstants,
  SfProvarCommandResult,
  setNestedProperty,
} from '@provartesting/provardx-plugins-utils';
import { Global } from '@salesforce/core';
import * as validateConstants from '../../../../assertion/validateConstants.js';
import * as runConstants from '../../../../assertion/runConstants.js';

describe('provar automation test run NUTs', () => {
  void UpdateFileConfigSfdx();
  let configFilePath = '';

  async function UpdateFileConfigSfdx(): Promise<void> {
    const files = await fs.readdir(Global.SF_DIR);
    const configFileName = files.find((filename) => filename.match('config.json'));
    if (!configFileName) {
      configFilePath = path.join(Global.SF_DIR, 'config.json');
      const emptyConfig = JSON.stringify({}, null, 2);
      await fs.writeFile(configFilePath, emptyConfig, 'utf8');
    } else {
      configFilePath = path.join(`${Global.SF_DIR}`, `${configFileName}`);
    }
  }
  enum FILE_PATHS {
    PROVARDX_PROPERTIES_FILE = 'provardx-properties.json',
  }

  it('Boilerplate json file should not run if the file has not been loaded', () => {
    // Read the config.json file
    const fileData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    /* eslint-disable */
    const configFile = JSON.parse(fileData);
    if ('PROVARDX_PROPERTIES_FILE_PATH' in configFile) {
      delete configFile.PROVARDX_PROPERTIES_FILE_PATH;
    }
    // Convert the updated JSON object back to a string
    const updatedFileData = JSON.stringify(configFile, null, 4);

    // Write the updated JSON string back to the config.json file
    fileSystem.writeFileSync(configFilePath, updatedFileData, 'utf8');

    const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`).shellOutput;
    expect(res.stderr).to.deep.equal(`Error (1): [MISSING_FILE] ${errorMessages.MISSING_FILE_ERROR}\n\n\n`);
  });

  it('Boilerplate json file should not run if the file has not been loaded and return result in json format', () => {
    const res = execCmd<SfProvarCommandResult>(`${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`, {
      ensureExitCode: 0,
    });
    expect(res.jsonOutput).to.deep.equal(validateConstants.missingFileJsonError);
  });

  it('Test Run command should be successful', () => {
    // Read the config.json file
    const configFilePatheData = fileSystem.readFileSync(configFilePath, { encoding: 'utf8' });

    // Parse the JSON data
    const configFilePathParsed = JSON.parse(configFilePatheData);
    configFilePathParsed['PROVARDX_PROPERTIES_FILE_PATH'] = path.join(process.cwd(), './provardx-properties.json');
    // Convert the updated JSON object back to a string
    const updatedCongiFileData = JSON.stringify(configFilePathParsed, null, 4);

    // Write the updated JSON string back to the config.json file
    fileSystem.writeFileSync(configFilePath, updatedCongiFileData, 'utf8');

    const SET_PROVAR_HOME_VALUE = path.join(process.cwd(), './ProvarHome').replace(/\\/g, '/');
    const SET_PROJECT_PATH_VALUE = path.join(process.cwd(), './ProvarRegression/AutomationRevamp').replace(/\\/g, '/');
    const SET_RESULT_PATH = './';

    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonFilePath = FILE_PATHS.PROVARDX_PROPERTIES_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.provarHome = SET_PROVAR_HOME_VALUE;
    jsonData.projectPath = SET_PROJECT_PATH_VALUE;
    jsonData.resultsPath = SET_RESULT_PATH;
    jsonData.testCase = ['/Test Case 1.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stdout).to.deep.equal(runConstants.successMessage);
  });

  it('Test Run command should be successful and return result in json', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.SuccessJson);
  });

  it('Test Run command should not be successful and return the error', () => {
    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[];
    }
    const jsonFilePath = FILE_PATHS.PROVARDX_PROPERTIES_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 4.testcase'];
    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stderr).to.deep.equal(runConstants.errorMessage);
  });

  it('Test Run command should not be successful and return result in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.errorJson);
  });

  it('Test case should be Executed successfully when Environment is encrypted', () => {
    interface EnvironmentSecret {
      name: string;
      secretsPassword: string;
    }

    interface PropertyFileJsonData {
      [key: string]: string | boolean | number | string[] | { [key: string]: string } | EnvironmentSecret[] | undefined;
      environmentsSecrets?: EnvironmentSecret[];
    }
    const jsonFilePath = FILE_PATHS.PROVARDX_PROPERTIES_FILE;
    // reading the json data
    const jsonDataString = fileSystem.readFileSync(jsonFilePath, 'utf-8');
    const jsonData: PropertyFileJsonData = JSON.parse(jsonDataString) as PropertyFileJsonData;
    jsonData.testCase = ['/Test Case 4.testcase'];
    setNestedProperty(jsonData, 'environment.testEnvironment', 'Env');
    jsonData.environmentsSecrets = [
      {
        name: 'Env',
        secretsPassword: "Priya@123+,-./:;_{|}~'()*<=>?[]^!#$%&",
      },
    ];

    const updatedJsonDataString = JSON.stringify(jsonData, null, 2);
    fileSystem.writeFileSync(jsonFilePath, updatedJsonDataString, 'utf-8');

    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND}`
    ).shellOutput;
    expect(result.stderr).to.deep.equal(runConstants.errorMessage);
  });

  it('Test case should be Executed successfully when Environment is encrypted and return result in json format', () => {
    const result = execCmd<SfProvarCommandResult>(
      `${commandConstants.SF_PROVAR_AUTOMATION_TEST_RUN_COMMAND} --json`
    ).jsonOutput;
    expect(result).to.deep.equal(runConstants.errorJson);
  });
});
