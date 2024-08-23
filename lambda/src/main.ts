import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createPodcast } from './process_pod';
import { startup } from './init';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    await startup();
    await createPodcast("russia_script3").then((res) => {
        console.log(res);
    });

    return {
        statusCode: 200,
        body: 'hello world',
    };
};

async function testLambdaHandler() {
    
    await startup();
    console.log('RUN_TEMP:', process.env.RUN_TEMP);
    console.log('IS_LAMBDA:', process.env.IS_LAMBDA);
    console.log('IS_DOCKER:', process.env.IS_DOCKER);

    await createPodcast("russia_script3").then((res) => {
        console.log(res);
    });
}

testLambdaHandler();