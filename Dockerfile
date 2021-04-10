# Set up build
FROM node:lts@sha256:9b64612a118f39210931612573edfc75768f7e07a0d6ca0de82924c8d400a07a AS build

RUN mkdir -p /atm/home/output

WORKDIR /usr/src

COPY . ./ 

RUN npm ci --no-optional && \
    npm run compile && \
    rm -rf node_modules .git
 
# Set up running image     
FROM atomist/skill:node14@sha256:1046eabcca4e41e9602fd08becce02c14390fef1b60bd3c8eff31f058027fd89

RUN curl -LO https://github.com/sigstore/cosign/releases/download/v0.2.0/cosign-linux-amd64 && \
    chmod +x cosign-linux-amd64 && \
    mv cosign-linux-amd64 /usr/local/bin/cosign

WORKDIR "/skill"

COPY package.json package-lock.json ./

RUN npm ci --no-optional \
    && rm -rf /root/.npm

COPY --from=build /usr/src/ .

ENTRYPOINT ["node", "--no-deprecation", "--trace-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=512", "/skill/bin/start.js"]
CMD ["run"]
