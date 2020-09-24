import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router-dom';
import ReactTable from 'react-table';
import {
  getRankingValues,
  deleteRankingValue,
  updateRankingValue,
  createRankingValue,
} from '../../data/rankingValue/RankingValueActions.js';
import {getRankingProviders} from '../../data/rankingProvider/RankingProviderActions';
import Confirmation from '../../components/layout/Confirmation.js';
import AdminSidebar from '../../components/adminSidebar/AdminSidebar.js';
import 'react-table/react-table.css';
import './admin.css';
import RankingValueModal from './RankingValueModal.js';

class RankingValueList extends Component {
  constructor(self) {
    super(self);
    this.state = {
      selectedItem: null,
      isDeleting: false,
      isOpenModal: false,
      editingRankingValue: {},
    };

    this.fetchData = this.fetchData.bind(this);
    this.editItem = this.editItem.bind(this);
    this.deleteItemClick = this.deleteItemClick.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.closeEditingModal = this.closeEditingModal.bind(this);
    this.closeAddModal = this.closeAddModal.bind(this);
    this.updateRankingValue = this.updateRankingValue.bind(this);
    this.addItem = this.addItem.bind(this);
    this.createNewRankingValue = this.createNewRankingValue.bind(this);
  }

  tableColumns = [
    {
      Header: 'Name',
      accessor: 'name',
      style: {
        paddingTop: '12px',
      },
    },
    {
      Header: 'Provider',
      accessor: 'provider_name',
      style: {
        paddingTop: '12px',
      },
    },
    {
      id: 'edit',
      accessor: 'id_ranking_value',
      filterable: false,
      Cell: ({value}) => (
        <div className="clearfix">
          <div className="btn-group btn-group-sm float-right" role="group">
            <button
              onClick={() => this.editItem({value})}
              type="button"
              className="btn btn-secondary border-radius-right-0"
            >
              <i className="far fa-fw fa-edit" />
            </button>
            <button
              onClick={() => this.deleteItemClick({value})}
              type="button"
              className="btn btn-danger border-left border-radius-left-0"
            >
              <i className="far fa-fw fa-trash-alt" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  fetchData(state) {
    const {getRankingValues} = this.props;
    let sortBy = '';

    for (let i = 0; i < state.sorted.length; i++) {
      if (sortBy !== '') sortBy += ',';
      sortBy += state.sorted[i].id + (state.sorted[i].desc ? ' desc' : '');
    }

    const filter = encodeURIComponent(JSON.stringify(state.filtered));
    getRankingValues(state.page + 1, state.pageSize, sortBy, filter);
  }

  getDeleteMessage() {
    return (
      <>
        Are you sure you want to delete the ranking value{' '}
        <strong className="text-dark">
          {this.state.selectedItem ? this.state.selectedItem.name : ''}
        </strong>
        ? This action cannot be undone.
      </>
    );
  }

  editItem({value: id}) {
    const {rankingValues = []} = this.props;
    const rankingValue = rankingValues.find(s => s.id_ranking_value === id);

    this.setState({
      isOpenModal: 'UPDATE',
      editingRankingValue: rankingValue || {},
    });
  }

  addItem() {
    this.setState({
      isOpenModal: 'CREATE',
    });
  }

  closeEditingModal() {
    this.setState({
      isOpenModal: false,
      editingRankingValue: {},
    });
  }

  closeAddModal() {
    this.setState({
      isOpenModal: false,
    });
  }

  deleteItemClick(id) {
    this.setState({
      selectedItem: this.props.rankingValues.filter(
        u => u.id_ranking_value === id.value,
      )[0],
      isDeleting: true,
    });
  }

  deleteItem(id) {
    this.setState({selectedItem: null, isDeleting: false});
    const {deleteRankingValue} = this.props;
    const {
      current_page,
      page_size,
      sort_by,
      filter,
    } = this.props.rankingValuesPagination;

    deleteRankingValue(id).then(() =>
      getRankingValues(current_page, page_size, sort_by, filter),
    );
  }

  async createNewRankingValue({name}) {
    await this.props
      .createRankingValue({
        name,
        date_changed: new Date(),
      })
      .catch(() => {
        this.setState({isOpenModal: false});
        console.log('error');
        return;
      });
    const {
      current_page,
      page_size,
      sort_by,
      filter,
    } = this.props.rankingValuesPagination;

    getRankingValues(current_page, page_size, sort_by, filter);
    this.setState({isOpenModal: false});
  }

  async updateRankingValue({name, id_ranking_provider}) {
    const {editingRankingValue} = this.state;
    await this.props
      .updateRankingValue(editingRankingValue.id_ranking_value, {
        ...editingRankingValue,
        name,
        id_ranking_provider,
      })
      .catch(() => {
        this.setState({isOpenModal: false});
        console.log('error');
        return;
      });
    this.setState({
      isOpenModal: false,
      editingRankingValue: {},
    });
  }

  componentDidMount() {
    this.props.getRankingProviders();
  }

  render() {
    const {
      currentUser,
      isLoggingIn,
      rankingValues,
      rankingValuesPagination,
    } = this.props;
    if (isLoggingIn) return null;
    if (!currentUser) return <Redirect to="/login" />;
    let {isOpenModal} = this.state;

    return (
      <div className="d-table w-100 h-100">
        <div className="d-table-cell bg-dark sidebar align-top">
          <AdminSidebar />
        </div>
        <div className="d-table-cell p-5 align-top">
          <div className="mb-4 clearfix">
            <h1 className="page-title float-left text-dark mr-3">
              Ranking Values
            </h1>
            <button
              onClick={this.addItem}
              className="float-left mt-2 btn btn-primary rounded-lg px-3"
            >
              <i className="fas fa-plus mr-2" />
              Add new
            </button>
          </div>
          <div>
            <ReactTable
              manual
              filterable
              data={rankingValues}
              columns={this.tableColumns}
              defaultPageSize={15}
              pages={rankingValuesPagination.total_pages}
              pageSizeOptions={[10, 15, 20, 50]}
              showPageSizeOptions={true}
              loading={rankingValuesPagination.is_loading}
              onFetchData={this.fetchData}
              className="-striped -highlight"
            />
            {this.state.isDeleting && (
              <Confirmation
                id={this.state.selectedItem.id_ranking_value}
                title="Delete rankingValue"
                message={this.getDeleteMessage()}
                buttonLabel={'Delete'}
                onConfirm={this.deleteItem}
                onClose={() =>
                  this.setState({selectedItem: null, isDeleting: false})
                }
              />
            )}
          </div>
          <RankingValueModal
            isOpen={this.state.isOpenModal}
            rankingValue={this.state.editingRankingValue}
            closeModal={
              isOpenModal === 'UPDATE'
                ? this.closeEditingModal
                : this.closeAddModal
            }
            rankingProviders={this.props.rankingProviders || []}
            onSubmit={
              isOpenModal === 'UPDATE'
                ? this.updateRankingValue
                : this.createNewRankingValue
            }
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentUser: state.user.currentUser,
    isLoggingIn: state.user.isLoggingIn,
    rankingValues: state.rankingValue.rankingValues,
    rankingValuesPagination: state.rankingValue.rankingValuesPagination,
    rankingProviders: state.rankingProvider.rankingProviders,
  };
}

export default connect(
  mapStateToProps,
  {
    getRankingValues,
    deleteRankingValue,
    updateRankingValue,
    createRankingValue,
    getRankingProviders,
  },
)(RankingValueList);
