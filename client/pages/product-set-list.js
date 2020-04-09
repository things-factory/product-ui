import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  navigate
} from '@things-factory/shell'
import { getCodeByName } from '@things-factory/code-base'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './product-set-option'

class ProductSetList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _productId: String,
      _productName: String,
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
      title: i18next.t('title.product_set') + this._productName,
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveProductSets(this.dataGrist.exportPatchList({ flagName: 'cuFlag ' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteProductSets.bind(this)
        },
        {
          title: i18next.t('button.back'),
          action: this._onBackButtonClick.bind(this)
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

  async pageInitialized() {
    const productSetStatus = await getCodeByName('PRODUCT_SET_STATUS')
    const productType = await getCodeByName('PRODUCT_TYPES')
    const packingType = await getCodeByName('PACKING_TYPES')

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
      rows: {
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (_columns, _data, _column, record, _rowIndex) => {
              if (record.id) this._openProductSetOption(record.id, record.name)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          record: { editable: true },
          header: i18next.t('field.product_code'),
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          record: { editable: true },
          header: i18next.t('field.description'),
          sortable: true,
          width: 200
        },
        {
          type: 'select',
          name: 'type',
          header: i18next.t('field.type'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(productType).map(key => productType[key].name)]
          },
          sortable: true,
          width: 120
        },
        {
          type: 'select',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(packingType).map(key => packingType[key].name)]
          },
          width: 120
        },
        {
          type: 'select',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(productSetStatus).map(key => productSetStatus[key].name)]
          },
          width: 100
        },
        {
          type: 'object',
          name: 'productSupersede',
          record: {
            editable: true,
            options: { queryName: 'products' }
          },
          header: i18next.t('field.product_ref'),
          sortable: true,
          width: 150
        },
        {
          type: 'integer',
          name: 'expirationPeriod',
          record: { align: 'center', editable: true },
          header: i18next.t('field.expiration_period'),
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'weightUnit',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.weight_unit'),
          width: 80
        },
        {
          type: 'float',
          name: 'weight',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.weight'),
          width: 80
        },
        {
          type: 'float',
          name: 'weightRatio',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.weight_ratio'),
          width: 80
        },
        {
          type: 'string',
          name: 'lengthUnit',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.length_unit'),
          width: 80
        },
        {
          type: 'float',
          name: 'width',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.width'),
          width: 80
        },
        {
          type: 'float',
          name: 'depth',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.depth'),
          width: 80
        },
        {
          type: 'float',
          name: 'height',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.height'),
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit1',
          record: { editable: true, align: 'center' },
          header: `${i18next.t('field.aux_unit')} 1`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue1',
          record: { editable: true, align: 'center' },
          header: `${i18next.t('field.aux_value')} 1`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit2',
          record: { editable: true, align: 'center' },
          header: `${i18next.t('field.aux_unit')} 2`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue2',
          record: { editable: true, align: 'center' },
          header: `${i18next.t('field.aux_value')} 2`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit3',
          record: { editable: true, align: 'center' },
          header: `${i18next.t('field.aux_unit')} 3`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue3',
          record: { editable: true, align: 'center' },
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
      this._productName = '(' + lifecycle.params.productName + ')' || this._productName || ''
      this.dataGrist.fetch()
    }
    // if (this.active) {
    //   this.dataGrist.fetch()
    // }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    let filters = []
    if (this._productId) {
      filters.push({
        name: 'product',
        operator: 'eq',
        value: this._productId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          productSets(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
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
              packingType
              status
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

  _openProductSetOption(id, name) {
    openPopup(
      html`
        <product-set-option .productSetId="${id}"></product-set-option>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.product_option') + '(' + name + ')'
      }
    )
  }

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
                patches,
                product: { id: this._productId }
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

  async _onBackButtonClick(e) {
    navigate(`products`)
  }

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('product-set-list', ProductSetList)
