import * as prettier from 'prettier';
import { FormatOptions } from '../enums/FormatOptions';
import { ICompileOptions } from '../interfaces/ICompileOptions';
import { GlobWrapper } from '../wrappers/GlobWrapper';
import { Compiler } from './Compiler';
import { Translator } from './Translator';

/**
 * Engine translator class
 */
export class Engine {
  private readonly glob: GlobWrapper;
  private readonly compiler: Compiler;
  private readonly translator: Translator;

  constructor() {
    this.compiler = new Compiler();
    this.glob = new GlobWrapper();
    this.translator = new Translator();
  }

  /**
   * Transform a translations array in a js string
   * @param fileTranslations Array of translations objects
   */
  public async getJSTranslation({
    yamlLangContent
  }: {
    yamlLangContent: string;
  }): Promise<string> {
    const translationsArray = await this.translator.generateYamlFileTranslationsArray(
      {
        fileContent: yamlLangContent
      }
    );

    const translationResult = {};
    translationsArray.forEach((fileTranslation: object) => {
      const languageKey = Object.keys(fileTranslation)[0];
      translationResult[languageKey] = {
        ...fileTranslation[languageKey]
      };
    });

    const content = `module.exports = ${JSON.stringify(
      translationResult,
      undefined,
      '\t'
    )}`;

    return prettier.format(content, {
      parser: 'babel',
      singleQuote: false,
      trailingComma: 'none'
    });
  }

  /**
   * Transform a translations array in a json string
   * @param fileTranslations Array of translations objects
   */
  public async getJSONTranslation({
    yamlLangContent
  }: {
    yamlLangContent: string;
  }): Promise<string> {
    const translationsArray = await this.translator.generateYamlFileTranslationsArray(
      {
        fileContent: yamlLangContent
      }
    );

    const translationResult = {};
    translationsArray.forEach((fileTranslation: object) => {
      const languageKey = Object.keys(fileTranslation)[0];
      translationResult[languageKey] = {
        ...fileTranslation[languageKey]
      };
    });

    return `${JSON.stringify(translationResult, undefined, '\t')}`;
  }

  /**
   * @method yamlCompile Does the actual yaml to js/json translation
   * @param globAsync Glob style path where to find the yaml files
   * @param outputDirectory Directory to output the translations
   * @param options Compile options
   */
  public async compile({
    globPath = './**/*.lang.yaml',
    outputDirectory = './translations',
    options = {}
  }: {
    globPath?: string;
    outputDirectory?: string;
    options?: ICompileOptions;
  } = {}): Promise<void> {
    if (options.format === undefined) {
      options.format = FormatOptions.JSON;
    }
    if (options.splitFiles === undefined) {
      options.splitFiles = true;
    }
    if (options.outputName === undefined) {
      options.outputName = 'translations';
    }

    //Get every yaml translations file path
    const filePaths = await this.glob.globAsync({
      pattern: globPath
    });

    const outDir = this.cleanOutputDir({ outputDirectory });

    const filesTranslations = [];
    for (const path of filePaths) {
      const pathTranslations = await this.translator.generateYamlFileTranslationsArray(
        {
          filePath: path
        }
      );

      filesTranslations.push(...pathTranslations);
    }

    await this.compiler.compileTranslations({
      filesTranslations,
      outputDirectory: outDir,
      splitFiles: options.splitFiles,
      format: options.format,
      outputName: options.outputName
    });
  }

  private cleanOutputDir({
    outputDirectory
  }: {
    outputDirectory: string;
  }): string {
    let outputDir = outputDirectory;

    if (outputDirectory.substr(-1) === '/' && outputDirectory.length > 1) {
      outputDir = outputDirectory.slice(0, outputDirectory.length - 1);
    }

    return outputDir;
  }
}
