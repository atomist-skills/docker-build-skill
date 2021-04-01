# Set up build
FROM node:lts@sha256:f6b9ff4caca9d4f0a331a882e560df242eb332b7bbbed2f426784de208fcd7bd AS build

RUN mkdir -p /atm/home/output

WORKDIR /usr/src

COPY . ./ 

RUN npm ci --no-optional && \
    npm run compile && \
    rm -rf node_modules .git
 
# Set up running image     
FROM atomist/skill:node14@sha256:c1b9eb5de2020fbe8b399bed961b7e2564cdcb1f14a4b43b249b014317cc35b4

WORKDIR "/skill"

COPY package.json package-lock.json ./

RUN npm ci --no-optional \
    && rm -rf /root/.npm

COPY --from=build /usr/src/ .

ENTRYPOINT ["node", "--no-deprecation", "--trace-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=512", "/skill/bin/start.js"]
CMD ["run"]
