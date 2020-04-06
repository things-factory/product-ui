import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openImportPopUp } from '@things-factory/import-ui'
import { client, CustomAlert, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class ProductSetList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _productId: String,
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
      title: i18next.t('title.product_set'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveProductSets(this.dataGrist.exportPatchList({ flagName: 'cuFlag ' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteProductSets.bind(this)
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
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.config = {
      // rows: {
      //   handlers: { click: this._setProductRefCondition.bind(this) },
      //   selectable: { multiple: true }
      // },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          record: { editable: true },
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          header: i18next.t('field.name'),
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'productRef',
          record: {
            editable: true,
            options: { queryName: 'products' }
          },
          imex: { header: 'Product Ref', key: 'productRef', width: 50, type: 'string' },
          header: i18next.t('field.product_ref'),
          sortable: true,
          width: 230
        },
        {
          type: 'string',
          name: 'description',
          record: { editable: true },
          imex: { header: 'Description', key: 'description', width: 50, type: 'string' },
          header: i18next.t('field.description'),
          sortable: true,
          width: 300
        },
        {
          type: 'string',
          name: 'type',
          record: { align: 'center', editable: true },
          imex: { header: 'Type', key: 'type', width: 50, type: 'string' },
          header: i18next.t('field.type'),
          sortable: true,
          width: 80
        },
        {
          type: 'integer',
          name: 'expirationPeriod',
          record: { align: 'center', editable: true },
          imex: { header: 'Expiration Period', key: 'expirationPeriod', width: 50, type: 'integer' },
          header: i18next.t('field.expiration_period'),
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'weightUnit',
          record: { editable: true, align: 'center' },
          imex: { header: 'Weight Unit', key: 'weightUnit', width: 50, type: 'string' },
          header: i18next.t('field.weight_unit'),
          width: 80
        },
        {
          type: 'float',
          name: 'weight',
          record: { editable: true, align: 'center' },
          imex: { header: 'Weight', key: 'weight', width: 50, type: 'float' },
          header: i18next.t('field.weight'),
          width: 80
        },
        {
          type: 'float',
          name: 'weightRatio',
          record: { editable: true, align: 'center' },
          imex: { header: 'Weight Ratio', key: 'weightRatio', width: 50, type: 'float' },
          header: i18next.t('field.weight_ratio'),
          width: 80
        },
        {
          type: 'string',
          name: 'lengthUnit',
          record: { editable: true, align: 'center' },
          imex: { header: 'Length Unit', key: 'lengthUnit', width: 50, type: 'string' },
          header: i18next.t('field.length_unit'),
          width: 80
        },
        {
          type: 'float',
          name: 'width',
          record: { editable: true, align: 'center' },
          imex: { header: 'Width', key: 'width', width: 50, type: 'float' },
          header: i18next.t('field.width'),
          width: 80
        },
        {
          type: 'float',
          name: 'depth',
          record: { editable: true, align: 'center' },
          imex: { header: 'Depth', key: 'depth', width: 50, type: 'float' },
          header: i18next.t('field.depth'),
          width: 80
        },
        {
          type: 'float',
          name: 'height',
          record: { editable: true, align: 'center' },
          imex: { header: 'Height', key: 'height', width: 50, type: 'float' },
          header: i18next.t('field.height'),
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit1',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Unit 1', key: 'auxUnit1', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_unit')} 1`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue1',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Value 1', key: 'auxValue1', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_value')} 1`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit2',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Unit 2', key: 'auxUnit2', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_unit')} 2`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue2',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Value 2', key: 'auxValue2', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_value')} 2`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit3',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Unit 3', key: 'auxUnit3', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_unit')} 3`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue3',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Value 3', key: 'auxValue3', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_value')} 3`,
          width: 80
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
      this._productId = lifecycle.params.productId || this._productId || ''
      this.dataGrist.fetch()
    }
    // if (this.active) {
    //   this.dataGrist.fetch()
    // }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    const response = await client.query({
      query: gql`
        query {
          productSets(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              productSupersede {
                name
                description
              }
              type
              expirationPeriod
              weightUnit
              weight
              weightRatio
              lengthUnit
              width
              depth
              height
              auxUnit1
              auxValue1
              auxUnit2
              auxValue2
              auxUnit3
              auxValue3
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
        total: response.data.productSets.total || 0,
        records: response.data.productSets.items || []
      }
    }
  }

  // _setProductRefCondition(_columns, _data, _column, record, _rowIndex) {
  //   this.config.columns.map(column => {
  //     if (column.name === 'productRef') {
  //       if (record && record.id) {
  //         column.record.options.basicArgs = { filters: [{ name: 'id', operator: 'noteq', value: record.id }] }
  //       } else {
  //         delete column.record.options.basicArgs
  //       }
  //     }
  //   })
  // }

  async _saveProductSets(patches) {
    if (patches && patches.length) {
      patches = patches.map(patch => {
        patch.weight = parseFloat(patch.weight)
        patch.weightRatio = parseFloat(patch.weightRatio)
        patch.width = parseFloat(patch.width)
        patch.depth = parseFloat(patch.depth)
        patch.height = parseFloat(patch.height)
        patch.expirationPeriod = parseFloat(patch.expirationPeriod)
        return patch
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleProductSet(${gqlBuilder.buildArgs({
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

  async _deleteProductSets() {
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
            deleteProductSets(${gqlBuilder.buildArgs({ ids })})
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

window.customElements.define('product-set-list', ProductSetList)
