import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createPodcast } from './process_pod';
import { initSecrets } from './init';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    await createPodcast("russia_script3").then((res) => {
        console.log(res);
    });
    

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
            port: 3000
        }),
    };
};