FROM node:lts

# Install dapr CLI
RUN wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

# Install daprd
ARG DAPR_BUILD_DIR
COPY $DAPR_BUILD_DIR /opt/dapr
ENV PATH="/opt/dapr/:${PATH}"
RUN dapr init --slim

# Install your app
WORKDIR /server
COPY package*.json ./
RUN ["npm", "install"]
COPY . .
EXPOSE 3500

# https://stackoverflow.com/a/56454994
RUN ["npm", "rebuild", "bcrypt", "--build-from-source"]

# Run the app using Dapr
CMD ["sh", "-c", "dapr run --app-port 4500 --app-id \"functions\" --app-protocol \"http\" --dapr-http-port 3500 --components-path ./components -- npm run start:dev"]
