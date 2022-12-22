import * as fs from "fs";
import { PluginInstance } from "../PluginInstance";

export async function constructEnvFromJson(
  functionInstance: PluginInstance,
) {
  const keys: any = {
    //@ts-ignore
    APP_PORT: functionInstance.getContainerController().getPortNumber(true),
  };

  return keys;
}

export async function writeEnv(
  functionInstance: PluginInstance,
) {
  const path = `${functionInstance.getInstallationPath()}/.env`;
  let env = "";
  const keys: any = await constructEnvFromJson(functionInstance);
  Object.keys(keys).map((key) => {
    env += `${key}="${keys[key]}"
`;
  });

  fs.writeFileSync(path, env);
}
