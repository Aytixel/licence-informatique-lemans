# Licence-Informatique-LeMans.Tk
Site Web à destination de toute personne se trouvant en licence informatique à l'université du Mans.

## How to run it ?
To start the server you have to use this command: ***deno run --allow-net --allow-env --allow-read --allow-write --allow-run --unstable src/app.ts***

To start the server with docker you have to:
 - build the Dockerfile (if it is not done yet) : ***docker build -t licence-info .***
 - and run it with : ***docker run -d -v $PWD:/app --restart always -name licence-info licence-info***
