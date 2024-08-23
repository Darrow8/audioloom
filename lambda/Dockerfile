# Stage 1: Build stage
FROM public.ecr.aws/lambda/nodejs:18 as builder

# Set working directory inside the container
WORKDIR /usr/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy source files to the container
COPY src/ ./src/

# Run the build script
RUN npm run dbuild

# Stage 2: FFmpeg stage
FROM debian:bullseye as ffmpeg

RUN apt-get update -y && apt-get install -y wget xz-utils

# Download a static build of FFmpeg and extract it
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    && tar -xJf ffmpeg-release-amd64-static.tar.xz \
    && cp ffmpeg-*/ffmpeg /usr/bin/ffmpeg \
    && cp ffmpeg-*/ffprobe /usr/bin/ffprobe 

# Stage 3: Final image
FROM public.ecr.aws/lambda/nodejs:18

# Set the working directory inside the container
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy the build artifacts from the builder stage
COPY --from=builder /usr/app/dist/* ./

# Copy ffmpeg binary and all relevant libraries from the ffmpeg stage
COPY --from=ffmpeg /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg /usr/bin/ffprobe /usr/bin/ffprobe

# Add ffmpeg to PATH explicitly
ENV PATH="/usr/bin:${PATH}"

# Set the CMD to your Lambda function handler
CMD ["main.lambdaHandler"]
