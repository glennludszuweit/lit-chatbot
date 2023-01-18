import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('chatbot-element')
export class MyElement extends LitElement {
  @property({type: String}) chatbotTheme = '../src/css/variables.css';

  constructor() {
    super();
    (window as any).chatSettings = {
      endpoint: 'https://sandbox.caiplatform.com/webAdapterSocket',
      path: '/backend-channel-adaptor-web/socket.io',
      assetsBasePath: 'https://sandbox.caiplatform.com/frontend-web-chat/',
      channelAdaptorPath: 'http://backend-channel-adaptor-web:11006',
      masterBotID: '63a9f269-f5cf-4cfd-9850-b295db908d49',
      voiceEnabled: true,
      chatbotName: 'Deutschlandticket',
      storageType: 'sessionStorage',
      theme: 'dbregioChatbot.css',
      checkValidateLogin: false,
    };

    const meta = document.querySelector('meta');
    meta?.setAttribute('name', 'viewport');
    meta?.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
    );
  }

  loadStyles(styleSrc: string) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = styleSrc;
    style.type = 'text/css';
    document.head.appendChild(style);
  }

  loadScript() {
    let script = document.createElement('script');
    script.src = '../src/js/deutschlandticket.min.js';
    document.head.appendChild(script);
  }

  override render() {
    return html`
      ${this.loadStyles(this.chatbotTheme)}
      ${this.loadStyles('../src/css/streckenagent.css')} ${this.loadScript()}
    `;
  }
}
