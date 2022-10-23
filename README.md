# Licence-Informatique-LeMans.Tk V2
Site Web à destination de toute personne se trouvant en licence informatique à l'université du Mans.

## How to run it ?
To start the server you have to use this command:
 - ***deno run --allow-net --allow-env --allow-read --unstable src/app.ts***

To start the server with docker you have to run it with:
 - ***docker run -d -v $PWD:/app -w /app --restart always --name licence-info-v2 denoland/deno:latest run --allow-net --allow-env --allow-read --unstable src/app.ts***
