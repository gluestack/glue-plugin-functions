const { SpawnHelper, DockerodeHelper } = require("@gluestack/helpers");
import IApp from "@gluestack/framework/types/app/interface/IApp";
import IContainerController from "@gluestack/framework/types/plugin/interface/IContainerController";
import { generateDockerfile } from "./create-dockerfile";
import { PluginInstance } from "./PluginInstance";

export class PluginInstanceContainerController implements IContainerController {
  app: IApp;
  status: "up" | "down" = "down";
  portNumber: number;
  containerId: string;
  callerInstance: PluginInstance;

  constructor(app: IApp, callerInstance: PluginInstance) {
    this.app = app;
    this.callerInstance = callerInstance;
    this.setStatus(this.callerInstance.gluePluginStore.get("status"));
    this.setPortNumber(this.callerInstance.gluePluginStore.get("port_number"));
    this.setContainerId(
      this.callerInstance.gluePluginStore.get("container_id"),
    );
  }

  getCallerInstance(): PluginInstance {
    return this.callerInstance;
  }

  installScript() {
    return ["npm", "install"];
  }

  runScript() {
    const array = this.callerInstance.getInstallationPath().split("/");
    let appID = array.pop();
    if (appID === '') {
      appID = array.pop();
    }
    return [
      "dapr",
      "run",
      "-p", "9000", // app port
      "-a", appID, // app id
      "-P", "http", // dapr http protocol
      "-H", this.getPortNumber(), /// dapr http port
      "-d", "src/components"
    ];
  }

  async getEnv() {
    return {
      APP_PORT: await this.getPortNumber(),
    };
  }

  getDockerJson() {
    return {};
  }

  getStatus(): "up" | "down" {
    return this.status;
  }

  //@ts-ignore
  async getPortNumber(returnDefault?: boolean) {
    return new Promise((resolve, reject) => {
      if (this.portNumber) {
        return resolve(this.portNumber);
      }
      let ports =
        this.callerInstance.callerPlugin.gluePluginStore.get("ports") || [];
      DockerodeHelper.getPort(4500, ports)
        .then((port: number) => {
          this.setPortNumber(port);
          ports.push(port);
          this.callerInstance.callerPlugin.gluePluginStore.set("ports", ports);
          return resolve(this.portNumber);
        })
        .catch((e: any) => {
          reject(e);
        });
    });
  }

  getContainerId(): string {
    return this.containerId;
  }

  setStatus(status: "up" | "down") {
    this.callerInstance.gluePluginStore.set("status", status || "down");
    return (this.status = status || "down");
  }

  setPortNumber(portNumber: number) {
    this.callerInstance.gluePluginStore.set("port_number", portNumber || null);
    return (this.portNumber = portNumber || null);
  }

  setContainerId(containerId: string) {
    this.callerInstance.gluePluginStore.set(
      "container_id",
      containerId || null,
    );
    return (this.containerId = containerId || null);
  }

  getConfig(): any {}

  async up() {
    if (this.getStatus() !== "up") {
      await new Promise(async (resolve, reject) => {
        console.log("\x1b[33m");
        console.log(
          `${this.callerInstance.getName()}: Running "${this.installScript().join(
            " ",
          )}"`,
          "\x1b[0m",
        );
        SpawnHelper.run(
          this.callerInstance.getInstallationPath(),
          this.installScript(),
        )
          .then(() => {
            console.log("\x1b[33m");
            console.log(
              `${this.callerInstance.getName()}: Running "${this.runScript().join(
                " ",
              )}"`,
              "\x1b[0m",
            );
            SpawnHelper.start(
              this.callerInstance.getInstallationPath(),
              this.runScript(),
            )
              .then(async ({ processId }: { processId: string }) => {
                this.setStatus("up");
                this.setContainerId(processId);
                console.log("\x1b[32m");
                console.log(
                  `Use http://localhost:${await this.getPortNumber()}/ as your function endpoint`,
                );
                console.log("\x1b[0m");
                return resolve(true);
              })
              .catch((e: any) => {
                return reject(e);
              });
          })
          .catch((e: any) => {
            return reject(e);
          });
      });
    } else {
      console.log("\x1b[32m");
      console.log(
        `Use http://localhost:${await this.getPortNumber()}/ as your function endpoint`,
      );
      console.log("\x1b[0m");
    }
  }

  async down() {
    if (this.getStatus() !== "down") {
      await new Promise(async (resolve, reject) => {
        SpawnHelper.stop(this.getContainerId(), this.callerInstance.getName())
          .then(() => {
            this.setStatus("down");
            this.setContainerId(null);
            return resolve(true);
          })
          .catch((e: any) => {
            return reject(e);
          });
      });
    }
  }

  async build() {
    await generateDockerfile(this.callerInstance.getInstallationPath());
  }
}
