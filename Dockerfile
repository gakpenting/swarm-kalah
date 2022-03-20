FROM alpine:3
RUN apk add --update nodejs npm
RUN apk add curl wget
COPY start.sh .
COPY install.sh .
RUN sh install.sh
ENTRYPOINT ["sh","start.sh"]

  