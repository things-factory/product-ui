import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice, flattenObject } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

export class ProductSetOption extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        .button-container {
          padding: 10px 0 12px 0;
          text-align: center;
        }
        .button-container > button {
          background-color: var(--button-background-color);
          border: var(--button-border);
          border-radius: var(--button-border-radius);
          margin: var(--button-margin);
          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container > button:hover,
        .button-container > button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  static get properties() {
    return {
      productSetId: String,
      searchFields: Array,
      config: Object,
      _productSetOptionData: Object
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this._productSetOptionData}"
          .fetchHandler=${this.fetchHandler.bind(this)}
          @field-change="${this._onProductOptionValueChanged.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._saveProductSetOption}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteProductSetOption}>${i18next.t('button.delete')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      pagination: { infinite: true },
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'productOption',
          header: i18next.t('field.productOption'),
          record: { align: 'left', editable: false },
          sortable: false,
          width: 150
        },
        {
          type: 'object',
          name: 'productOptionValue',
          header: i18next.t('field.productOptionValue'),
          record: {
            editable: true,
            align: 'left',
            options: {
              queryName: 'productOptionValues',
              select: [
                { name: 'id', hidden: true },
                {
                  name: 'productOption',
                  type: 'object',
                  header: i18next.t('field.product_option'),
                  record: { align: 'center' }
                },
                { name: 'name', header: i18next.t('field.product_option_value'), record: { align: 'center' } }
              ],
              list: { fields: ['productOption'] }
            }
          },
          width: 300
        }
      ]
    }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    let filters = []
    if (this.productSetId) {
      filters.push({
        name: 'productSet',
        operator: 'eq',
        value: this.productSetId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          productSetOptions(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              productOptionValue{
                id
                name
                productOption{
                  name
                }
              }
              updatedAt
              updater{
                name
                description
              }
            }
            total
          }
        }
      `
    })
    this._productSetOptionData = {
      total: response.data.productSetOptions.total || 0,
      records:
        response.data.productSetOptions.items.map(item => {
          return { ...item, productOption: item.productOptionValue.productOption.name }
        }) || []
    }
  }

  _onProductOptionValueChanged(e) {
    this.dataGrist.dirtyData.records[e.detail.row].productOption = e.detail.after.productOption.name
  }

  async _saveProductSetOption() {
    let patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      patches = patches.map(productSetOption => {
        delete productSetOption.productOption
        return {
          ...productSetOption,
          productOptionValue: { id: productSetOption.productOptionValue.id }
        }
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleProductSetOption(${gqlBuilder.buildArgs({
              patches,
              productSetId: this.productSetId
            })}) {
              name
              description
            }
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_updated_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_changed'),
        text: i18next.t('text.there_is_nothing_to_save')
      })
    }
  }

  async _deleteProductSetOption() {
    const ids = this.dataGrist.selected.map(record => record.id)
    if (ids && ids.length > 0) {
      const anwer = await CustomAlert({
        type: 'warning',
        title: i18next.t('button.delete'),
        text: i18next.t('text.are_you_sure'),
        confirmButton: { text: i18next.t('button.delete') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!anwer.value) return

      const response = await client.query({
        query: gql`
            mutation {
              deleteProductSetOptions(${gqlBuilder.buildArgs({ ids })})
            }
          `
      })
      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_deleted_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_selected'),
        text: i18next.t('text.there_is_nothing_to_delete')
      })
    }
  }

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('product-set-option', ProductSetOption)
