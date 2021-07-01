import { Inject, Service } from '@tsed/di';
import { WebClient, LogLevel } from '@slack/web-api';
import { generateInputSectionBlock, GrowiCommand, generateMarkdownSectionBlock } from '@growi/slack';
import { AuthorizeResult } from '@slack/oauth';
import { GrowiCommandProcessor } from '~/interfaces/slack-to-growi/growi-command-processor';
import { OrderRepository } from '~/repositories/order';
import { Installation } from '~/entities/installation';
import { InvalidUrlError } from '../models/errors';

const isProduction = process.env.NODE_ENV === 'production';

@Service()
export class RegisterService implements GrowiCommandProcessor {

  @Inject()
  orderRepository: OrderRepository;

  async process(growiCommand: GrowiCommand, authorizeResult: AuthorizeResult, body: {[key:string]:string}): Promise<void> {
    const { botToken } = authorizeResult;

    const client = new WebClient(botToken, { logLevel: isProduction ? LogLevel.DEBUG : LogLevel.INFO });
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'register',
        title: {
          type: 'plain_text',
          text: 'Register Credentials',
        },
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
        close: {
          type: 'plain_text',
          text: 'Close',
        },
        private_metadata: JSON.stringify({ channel: body.channel_name }),

        blocks: [
          generateInputSectionBlock('growiUrl', 'GROWI domain', 'contents_input', false, 'https://example.com'),
          generateInputSectionBlock('tokenPtoG', 'Access Token Proxy to GROWI', 'contents_input', false, 'jBMZvpk.....'),
          generateInputSectionBlock('tokenGtoP', 'Access Token GROWI to Proxy', 'contents_input', false, 'sdg15av.....'),
        ],
      },
    });
  }

  async insertOrderRecord(
      installation: Installation | undefined,
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      botToken: string | undefined, payload: any,
  ): Promise<void> {
    const inputValues = payload.view.state.values;
    const growiUrl = inputValues.growiUrl.contents_input.value;
    const tokenPtoG = inputValues.tokenPtoG.contents_input.value;
    const tokenGtoP = inputValues.tokenGtoP.contents_input.value;

    const { channel } = JSON.parse(payload.view.private_metadata);

    const client = new WebClient(botToken, { logLevel: isProduction ? LogLevel.DEBUG : LogLevel.INFO });

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const url = new URL(growiUrl);
    }
    catch (error) {
      const invalidErrorMsg = 'Please enter a valid URL';

      await client.chat.postEphemeral({
        channel,
        user: payload.user.id,
        // Recommended including 'text' to provide a fallback when using blocks
        // refer to https://api.slack.com/methods/chat.postEphemeral#text_usage
        text: 'Invalid URL',
        blocks: [
          generateMarkdownSectionBlock(invalidErrorMsg),
        ],
      });

      throw new InvalidUrlError(growiUrl);
    }

    this.orderRepository.save({
      installation, growiUrl, tokenPtoG, tokenGtoP,
    });
  }

  async notifyServerUriToSlack(
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      botToken: string | undefined, payload: any,
  ): Promise<void> {

    const { channel } = JSON.parse(payload.view.private_metadata);

    const serverUri = process.env.SERVER_URI;

    const client = new WebClient(botToken, { logLevel: isProduction ? LogLevel.DEBUG : LogLevel.INFO });

    if (serverUri === process.env.OFFICIAL_BOT_PROXY_URL) {
      await client.chat.postEphemeral({
        channel,
        user: payload.user.id,
        // Recommended including 'text' to provide a fallback when using blocks
        // refer to https://api.slack.com/methods/chat.postEphemeral#text_usage
        text: 'Proxy URL',
        blocks: [
          generateMarkdownSectionBlock('Successfully registered with the proxy! Please check test connection in your GROWI'),
        ],
      });
      return;
    }

    await client.chat.postEphemeral({
      channel,
      user: payload.user.id,
      // Recommended including 'text' to provide a fallback when using blocks
      // refer to https://api.slack.com/methods/chat.postEphemeral#text_usage
      text: 'Proxy URL',
      blocks: [
        generateMarkdownSectionBlock('Please enter and update the following Proxy URL to slack bot setting form in your GROWI'),
        generateMarkdownSectionBlock(`Proxy URL: ${serverUri}`),
      ],
    });
    return;
  }

}
