# Licence-Informatique-LeMans.Tk
Site Web à destination de toute personne se trouvant en licence informatique à l'université du Mans.

## How to run it ?
To start the server you have to use this command:
 - ***deno run --allow-net --allow-env --allow-read --unstable src/app.ts***
 - ***deno run --allow-net --allow-env --allow-read --allow-write --allow-run --unstable src/runnable/data-retriever.js***

To start the server with docker you have to:
 - build the Dockerfile (if it is not done yet) : ***docker build -t licence-info-data-retriever .***
 - and run it with : 
    - ***docker run -d -v $PWD:/app -w /app --restart always --name licence-info denoland/deno:latest run --allow-net --allow-env --allow-read --unstable src/app.ts***
    - ***docker run -d -v $PWD:/app --restart always --name licence-info-data-retriever licence-info-data-retriever***
