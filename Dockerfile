# Set up build
FROM node:lts@sha256:af9879e7473d347048c5d5919aa9775f27c33d92e4d58058ffdc08247f4bd902 AS build

RUN mkdir -p /atm/home/output

WORKDIR /usr/src

COPY . ./ 

RUN npm ci --no-optional && \
    npm run compile && \
    rm -rf node_modules .git
 
# Set up running image     
FROM atomist/skill:node14@sha256:1248c259f5b77ac47aed85143ae01daf618cf2dbcabd59244f64cdb5fc8234e1

RUN apt-get update && \
    apt-get install -y curl=7.74.0-1ubuntu2 libpcsclite-dev=1.9.1-1 && \
    curl -LO https://github.com/sigstore/cosign/releases/download/v0.4.0/cosign-linux-amd64 && \
    chmod +x cosign-linux-amd64 && \
    mv cosign-linux-amd64 /usr/local/bin/cosign && \
    apt-get remove -y curl && \
    apt-get autoremove -y && \
    apt-get clean -y && \
    rm -rf /var/cache/apt /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    cosign version

WORKDIR "/skill"

COPY package.json package-lock.json ./

RUN npm ci --no-optional \
    && rm -rf /root/.npm

COPY --from=build /usr/src/ .

ENTRYPOINT ["node", "--no-deprecation", "--trace-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=512", "/skill/bin/start.js"]
CMD ["run"]
