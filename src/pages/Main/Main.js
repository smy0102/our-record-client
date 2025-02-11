import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Record from '../../components/Record/Record';
import Story from '../../components/Story/Story';
import SearchPlaceInput from '../../components/Main/Map/SearchPlaceInput';
import Nav from '../../components/Nav/Nav';
import Loading from '../../components/Common/Loading';
import Calendar from 'react-calendar';
import styled from 'styled-components';
import 'react-calendar/dist/Calendar.css';
import {
  tableSet,
  tableHeadSet,
  tableDataSet,
  bottomTableDataSet,
  buttonSet,
  flexSet,
} from '../../styles/mixin';
import { COST_CATEGORY } from '../../config';
import {
  API,
  getMainData,
  removeRecord,
  removeAllRecord,
  getDailyRecord,
} from '../../api';
import { Link } from 'react-router-dom';

const Main = () => {
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isRecordEditOpen, setIsRecordEditOpen] = useState(false);
  const [recordId, setRecordId] = useState();
  const [time, setTime] = useState();
  const [costCategory, setCostCategory] = useState();
  const [costContent, setCostContent] = useState();
  const [cost, setCost] = useState();
  const [picture, setPicture] = useState();
  const [story, setStory] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [notice, setNotice] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [convertedDate, setConvertedDate] = useState(new Date());
  const [placeName, setPlaceName] = useState('');
  const [searchTerm, setSearchTerm] = useState();
  const [long, setLong] = useState();
  const [lat, setLat] = useState();
  const [dailyRecordData, setDailyRecordData] = useState([]);
  const [coupleData, setCoupleData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyData, setStoryData] = useState();
  const [dDay, setDDay] = useState();

  useEffect(() => {
    const year = calendarDate.getFullYear();
    const month = `0${calendarDate.getMonth() + 1}`.slice(-2);
    const date = `0${calendarDate.getDate()}`.slice(-2);
    setConvertedDate(`${year}-${month}-${date}`);
    setSearchTerm('');
    showRecord(convertedDate);
  }, [calendarDate, convertedDate]);

  useEffect(() => {
    calculateTotalCost(dailyRecordData);
  }, [dailyRecordData]);

  const showRecord = async convertedDate => {
    try {
      const { data } = await getMainData(convertedDate);

      const coupleDate = new Date(data[1].dday);
      const today = new Date();
      const calcDate = today.getTime() - coupleDate.getTime();

      setDDay(Math.floor(calcDate / (1000 * 60 * 60 * 24)) - 1);
      setCoupleData(data[1]);
      setDailyRecordData(data[0] ? data[0] : []);
    } catch (e) {
      console.log(`error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleData = (event, setData, isCost) => {
    const { value } = event.target;
    isCost
      ? setData(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '1'))
      : setData(value);
  };

  const submitRecord = e => {
    e.preventDefault();

    const conditions = time && costContent && cost && costCategory;

    conditions
      ? window.confirm(`기록을 ${recordId ? '수정' : '입력'} 하시겠습니까?`) &&
        enrollRecord()
      : setNotice(true);
  };

  const enrollRecord = async () => {
    const recordData = new FormData();

    if (recordId) {
      recordData.append('_id', recordId);
      picture && recordData.append('datePhoto', picture);
    } else {
      recordData.append('place', placeName);
      recordData.append('datePhoto', picture);
      recordData.append('date', convertedDate);
      recordData.append('longitude', long);
      recordData.append('latitude', lat);
    }

    recordData.append('time', time);
    recordData.append('category', costCategory);
    recordData.append('expenseInfo', costContent);
    recordData.append('expense', cost);
    recordData.append('story', story);

    axios({
      url: `http://${API}/post/${recordId ? 'edit' : 'write'}`,
      method: 'post',
      data: recordData,
      withCredentials: true,
    })
      .then(res => {
        alert(`정보 ${recordId ? '수정' : '입력'}이 완료되었습니다`);
        getRecord();
        closeRecord();
      })
      .catch(error => console.log(error));
  };

  const cancleRecord = () => {
    if (
      window.confirm(
        `${isRecordEditOpen ? '수정' : '작성'}을 취소하시겠습니까?`
      )
    ) {
      closeRecord();
    }
  };

  const closeRecord = () => {
    setIsRecordOpen(false);
    setIsRecordEditOpen(false);
    setPlaceName('');
    setSearchTerm('');
    setLat();
    setLong();
    setTime();
    setCostCategory();
    setCostContent();
    setCost();
    setPicture();
    setStory();
    setRecordId();
    setNotice(false);
  };

  const calculateTotalCost = data => {
    if (data.length === 1) {
      setTotalCost(data[0].expense);
    } else {
      const sumResult = data.reduce((pre, crr) => pre + crr.expense, 0);
      setTotalCost(sumResult);
    }
  };

  const deleteRecord = id => {
    if (window.confirm('기록을 삭제하시겠습니까?')) {
      removeRecord(convertedDate, id);
      getRecord();
    }
  };

  const deleteAllRecord = () => {
    if (window.confirm('기록 전체를 삭제하시겠습니까?')) {
      removeAllRecord(convertedDate);
      setDailyRecordData([]);
    }
  };

  const getRecord = async () => {
    const { data } = await getDailyRecord(convertedDate);
    setDailyRecordData(data);
  };

  const openStory = event => {
    setStoryData(dailyRecordData.filter(data => data._id === event.target.id));
    setIsStoryOpen(true);
  };

  const closeStory = () => {
    setIsStoryOpen(false);
  };

  const editRecord = event => {
    const selectedRecord = dailyRecordData.filter(
      data => data._id === event.target.id
    )[0];

    setRecordId(selectedRecord._id);
    setTime(selectedRecord.time);
    setCostCategory(selectedRecord.category);
    setCostContent(selectedRecord.expenseInfo);
    setCost(selectedRecord.expense);
    selectedRecord.story && setStory(selectedRecord.story);
    selectedRecord.place && setPlaceName(selectedRecord.place);
    setIsRecordEditOpen(true);
  };

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <MainWrap>
          <Nav coupleData={coupleData} />
          <BodyWrap>
            <SideWrap>
              <ProfileImage
                alt="profile"
                src={`${
                  coupleData && coupleData.couple_img
                    ? coupleData.couple_img
                    : '/icon/couple.png'
                }`}
              />
              <NickNameWrap>
                {coupleData && coupleData.invitor_nickname ? (
                  <NickName>{coupleData.invitor_nickname}</NickName>
                ) : (
                  <NoNickName> 등록해 주세요</NoNickName>
                )}
                <HeartIcon alt="heart" src="/icon/heart.png" />{' '}
                {coupleData && coupleData.invitee_nickname ? (
                  <NickName>{coupleData.invitee_nickname}</NickName>
                ) : (
                  <NoNickName> 등록해 주세요</NoNickName>
                )}
              </NickNameWrap>
              <DDay>
                {coupleData && coupleData.dday ? `D + ${dDay}일` : ''}
              </DDay>
              <RecordCalendar>
                <Calendar
                  value={calendarDate}
                  maxDate={new Date()}
                  onChange={date => setCalendarDate(date)}
                />
              </RecordCalendar>
              <RecordButton onClick={() => setIsRecordOpen(true)}>
                기록하기
              </RecordButton>
              <Record
                isOpen={isRecordOpen}
                time={time}
                setTime={setTime}
                costCategory={costCategory}
                setCostCategory={setCostCategory}
                costContent={costContent}
                setCostContent={setCostContent}
                cost={cost}
                setCost={setCost}
                picture={picture}
                setPicture={setPicture}
                story={story}
                setStory={setStory}
                notice={notice}
                handleData={handleData}
                submitRecord={submitRecord}
                close={cancleRecord}
                placeName={placeName}
                convertedDate={convertedDate}
              />
              <Link to="/chart">
                <StatisticsButton>이 달의 통계</StatisticsButton>
              </Link>
            </SideWrap>
            <ContentsWrap>
              <MapWrap>
                <SearchPlaceInput
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setPlaceName={setPlaceName}
                  setLong={setLong}
                  setLat={setLat}
                  recordMarkers={dailyRecordData}
                />
              </MapWrap>
              {dailyRecordData.length !== 0 ? (
                <ListWrap>
                  <ListTitle>그 날의 기록</ListTitle>
                  <ListTable>
                    <thead>
                      <tr>
                        <TableHead style={{ width: '7%' }}>스토리</TableHead>
                        <TableHead style={{ width: '8%' }}>시간</TableHead>
                        <TableHead style={{ width: '18%' }}>장소</TableHead>
                        <TableHead style={{ width: '9%' }}>항목</TableHead>
                        <TableHead style={{ width: '27%' }}>내용</TableHead>
                        <TableHead style={{ width: '13%' }}>사용금액</TableHead>
                        <TableHead style={{ width: '8%' }}>삭제/수정</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRecordData.map(data => {
                        return (
                          <tr key={data._id}>
                            <TableData>
                              {data.datePhoto && data.story ? (
                                <>
                                  <StoryImage
                                    id={data._id}
                                    alt="story"
                                    src="/icon/binoculars.png"
                                    onClick={e => {
                                      openStory(e);
                                    }}
                                  />
                                  <Story
                                    isOpen={isStoryOpen}
                                    closeStory={closeStory}
                                    storyData={storyData}
                                  />
                                </>
                              ) : (
                                `-`
                              )}
                            </TableData>
                            <TableData>{data.time}</TableData>
                            <TableData>
                              {data.place ? data.place : `-`}
                            </TableData>
                            <TableData>
                              {COST_CATEGORY[data.category]}
                            </TableData>
                            <TableData>{data.expenseInfo}</TableData>
                            <TableData>
                              {data.expense.toLocaleString()}원
                            </TableData>
                            <TableData>
                              <DeleteButton
                                id={data._id}
                                alt="delete"
                                src="/icon/delete.png"
                                onClick={() => deleteRecord(data._id)}
                              />
                              <EditButton
                                id={data._id}
                                alt="edit"
                                src="/icon/edit.png"
                                onClick={e => editRecord(e)}
                              />
                              <Record
                                isOpen={isRecordEditOpen}
                                recordId={recordId}
                                time={time}
                                setTime={setTime}
                                costCategory={costCategory}
                                setCostCategory={setCostCategory}
                                costContent={costContent}
                                setCostContent={setCostContent}
                                cost={cost}
                                setCost={setCost}
                                picture={picture}
                                setPicture={setPicture}
                                story={story}
                                setStory={setStory}
                                notice={notice}
                                handleData={handleData}
                                submitRecord={submitRecord}
                                close={cancleRecord}
                                placeName={placeName}
                                convertedDate={convertedDate}
                              />
                            </TableData>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <BottomTableData colSpan="5">합계</BottomTableData>
                        <BottomTableData>
                          {Number(totalCost).toLocaleString()}원
                        </BottomTableData>
                        <BottomTableData
                          className="allDeleteButton"
                          onClick={() => deleteAllRecord()}
                        >
                          전체삭제
                        </BottomTableData>
                      </tr>
                    </tfoot>
                  </ListTable>
                </ListWrap>
              ) : (
                <EmptyData>
                  <EmptyDataImage alt="sad face" src="/icon/sad.png" />
                  <br />
                  기록이 없어요
                  <br />
                  새로운 추억을 남겨 보세요!
                </EmptyData>
              )}
            </ContentsWrap>
          </BodyWrap>
        </MainWrap>
      )}
    </>
  );
};

const MainWrap = styled.div`
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const BodyWrap = styled.div`
  ${flexSet('row', 'space-between')}
  padding: 0 35px;
`;

const SideWrap = styled.div`
  ${flexSet('column', 'flex-start', 'center')}
  height: 100%;
  padding: 10vh 35px 30px 0;
`;

const ProfileImage = styled.img`
  width: 150px;
  margin-bottom: 10px;
  padding: 3px;
  border: ${props => props.theme.basicBorder};
  border-radius: 50%;
`;

const NickNameWrap = styled.div`
  ${flexSet('row', 'center', 'center')}
  margin: 10px 0;
  font-size: 13px;
`;

const NickName = styled.span`
  font-weight: bold;
  color: ${props => props.theme.basicDarkGray};
`;

const NoNickName = styled.span`
  color: ${props => props.theme.basicGray};
  text-decoration: underline;
`;

const HeartIcon = styled.img`
  width: 22px;
  margin: 0 5px;
`;

const DDay = styled.div`
  margin-top: 10px;
`;

const RecordCalendar = styled.div`
  width: 230px;
  margin: 25px 0 10px 0;
`;

const RecordButton = styled.button`
  width: 230px;
  margin: 5px 0;
  padding: 3px 0;
  border: 1px solid rgb(220, 220, 220);
  border-radius: 3px;
  color: ${props => props.theme.basicDarkGray};
  background-color: white;
  font-size: 12px;
  box-shadow: 1px 1px rgb(200, 200, 200);
  cursor: pointer;
`;

const StatisticsButton = styled.button`
  width: 230px;
  padding: 3px 0;
  ${buttonSet}
`;

const ContentsWrap = styled.div`
  width: 100%;
  height: 100%;
  padding: 10vh 0 30px 45px;
  border-left: ${props => props.theme.basicBorder};
`;

const MapWrap = styled.div`
  height: 65vh;
  margin-bottom: 60px;
`;

const ListWrap = styled.div``;

const ListTitle = styled.div`
  margin-bottom: 15px;
  color: ${props => props.theme.basicDarkGray};
  font-size: 20px;
  font-weight: bold;
`;

const ListTable = styled.table`
  ${tableSet('100%')}
  font-size: 0.7rem;
`;

const TableHead = styled.th`
  ${tableHeadSet}
`;

const TableData = styled.td`
  ${tableDataSet}
`;

const BottomTableData = styled.td`
  ${bottomTableDataSet}

  &.allDeleteButton {
    cursor: pointer;
  }
`;

const StoryImage = styled.img`
  width: 22px;
  cursor: pointer;
`;

const DeleteButton = styled.img`
  width: 16px;
  margin-right: 5px;
  cursor: pointer;
`;

const EditButton = styled.img`
  width: 16px;
  cursor: pointer;
`;

const EmptyData = styled.div`
  min-height: 160px;
  padding-top: 20px;
  color: ${props => props.theme.basicGray};
  text-align: center;
  line-height: 150%;
  font-size: 16px;
`;

const EmptyDataImage = styled.img`
  width: 55px;
  opacity: 0.5;
`;

export default Main;
