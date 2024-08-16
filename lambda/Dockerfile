FROM public.ecr.aws/lambda/nodejs:18 as builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
RUN npm run dbuild
    
FROM public.ecr.aws/lambda/nodejs:18
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist/* ./
CMD ["main.lambdaHandler"]