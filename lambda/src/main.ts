import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createPodcast } from './process_pod';
import { startup } from './init';

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // await startup();
    // await createPodcast("russia_script3").then((res) => {
    //     console.log(res);
    // });
    // return {
    //     statusCode: 200,
    //     body: JSON.stringify({
    //         message: 'hello world',
    //         port: 3000
    //     }),
    // };
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
