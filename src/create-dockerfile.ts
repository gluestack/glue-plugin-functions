import { join } from "path";
import { writeFileSync } from "fs";

export const generateDockerfile = async (installationPath: string) => {
  const filepath = join(process.cwd(), installationPath);

  // Create an empty Dockerfile
  const dockerfile = [];

  // Set the base image for the Dockerfile
  dockerfile.push("FROM node:lts");

  // Create a working directory for the application
  dockerfile.push("WORKDIR /functions");

  // Copy the package.json and package-lock.json files to the working directory
  dockerfile.push("COPY . .");

  // Install the dependencies for the application
  dockerfile.push("RUN npm install");

  // Copy the rest of the source code for the application to the working directory
  dockerfile.push("COPY . .");

  // Expose port 8080
  dockerfile.push("EXPOSE 3000");

  // Write the Dockerfile to the filesystem
  writeFileSync(join(filepath, "Dockerfile"), dockerfile.join("\n"));
};
