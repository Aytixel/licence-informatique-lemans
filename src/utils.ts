async function getJson(filePath: string) {
  return JSON.parse(await Deno.readTextFile(filePath));
}

function getJsonSync(filePath: string) {
  return JSON.parse(Deno.readTextFileSync(filePath));
}

export { getJson, getJsonSync };
