async function getJson(filePath: string) {
  return JSON.parse(await Deno.readTextFile(filePath));
}

function getJsonSync(filePath: string) {
  return JSON.parse(Deno.readTextFileSync(filePath));
}

function createSubDomainConfig(config: any) { // create sub domain config from default config and sub domain overwrite config
  for (const subDomainName in config.subDomain) {
    const tempConfig = Object.assign({}, config.defaultConfig);
    const subDomainConfig = config.subDomain[subDomainName];

    for (const pathToRedirect in subDomainConfig) {
      tempConfig[pathToRedirect] = subDomainConfig[pathToRedirect];
    }

    config.subDomain[subDomainName] = tempConfig;
  }

  return config;
}

function inject(
  data: string,
  tagToReplace: string,
  replacementString: string,
) {
  return data.replace(
    new RegExp(
      `£[iI][nN][jJ][eE][cC][tT]{[ \t\n\r]*${tagToReplace.trim()}[ \t\n\r]}`,
      "gm",
    ),
    replacementString,
  );
}

export { createSubDomainConfig, getJson, getJsonSync, inject };
