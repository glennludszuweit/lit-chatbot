var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let MyElement = class MyElement extends LitElement {
    constructor() {
        super(...arguments);
        // Define reactive properties--updating a reactive property causes
        // the component to update.
        this.greeting = 'Hello';
        this.planet = 'World';
    }
    // The render() method is called any time reactive properties change.
    // Return HTML in a string template literal tagged with the `html`
    // tag function to describe the component's internal DOM.
    // Expressions can set attribute values, property values, event handlers,
    // and child nodes/text.
    render() {
        return html `
      <span @click=${this.togglePlanet}
        >${this.greeting}
        <span class="planet">${this.planet}</span>
      </span>
    `;
    }
    // Event handlers can update the state of @properties on the element
    // instance, causing it to re-render
    togglePlanet() {
        this.planet = this.planet === 'World' ? 'Mars' : 'World';
    }
};
// Styles are scoped to this element: they won't conflict with styles
// on the main page or in other components. Styling API can be exposed
// via CSS custom properties.
MyElement.styles = css `
    :host {
      display: inline-block;
      padding: 10px;
      background: lightgray;
    }
    .planet {
      color: var(--planet-color, blue);
    }
  `;
__decorate([
    property()
], MyElement.prototype, "greeting", void 0);
__decorate([
    property()
], MyElement.prototype, "planet", void 0);
MyElement = __decorate([
    customElement('chat-bot')
], MyElement);
export { MyElement };
//# sourceMappingURL=chatbot.js.map