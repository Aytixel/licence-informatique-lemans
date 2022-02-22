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

async function exists(path: string) {
  try {
    Deno.close((await Deno.open(path)).rid);
    return true;
  } catch (_) {
    return false;
  }
}

function existsSync(path: string) {
  try {
    Deno.close(Deno.openSync(path).rid);
    return true;
  } catch (_) {
    return false;
  }
}

export {
  createSubDomainConfig,
  exists,
  existsSync,
  getJson,
  getJsonSync,
  inject,
};
