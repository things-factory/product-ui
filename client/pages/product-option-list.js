import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class ProductOptionList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        search-form {
          overflow: visible;
        }
        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .data=${this.data}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.product_option'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveProductOption(this.dataGrist.exportPatchList({ flagName: 'cuFlag ' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteProductOption.bind(this)
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  pageInitialized() {
    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.config = {
      rows: {
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          record: { editable: true },
          header: i18next.t('field.name'),
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          record: { editable: true },
          header: i18next.t('field.description'),
          sortable: true,
          width: 400
        },
        {
          type: 'object',
          name: 'updater',
          record: { align: 'center', editable: false },
          header: i18next.t('field.updater'),
          width: 250
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: { align: 'center', editable: false },
          header: i18next.t('field.updated_at'),
          sortable: true,
          width: 180
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    const response = await client.query({
      query: gql`
        query {
          productOptions(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description              
              updater {
                name
                description
              }
              updatedAt
            }
            total
          }
        }
        `
    })

    if (!response.errors) {
      return {
        total: response.data.productOptions.total || 0,
        records: response.data.productOptions.items || []
      }
    }
  }

  async _saveProductOption(patches) {
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleProductOption(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
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

  async _deleteProductOption() {
    const ids = this.dataGrist.selected.map(record => record.id)
    if (ids && ids.length) {
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
            deleteProductOptions(${gqlBuilder.buildArgs({ ids })})
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

window.customElements.define('product-option-list', ProductOptionList)
