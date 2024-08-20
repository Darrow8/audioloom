import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createPodcast } from './process_pod';
import { startup } from './init';
import fs from 'fs';

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    await startup();
    // await createPodcast("russia_script3").then((res) => {
    //     console.log(res);
    // });
    // const tmpExists = fs.existsSync('/tmp');
    // console.log(`/tmp directory exists: ${tmpExists}`);

    // console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    // console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    return {
        statusCode: 200,
        body: 'hello world',
    };
};

// async function testLambdaHandler() {
//     // await startup();
//     // await createPodcast("russia_script3").then((res) => {
//     //     console.log(res);
//     // });
// }

// testLambdaHandler();
