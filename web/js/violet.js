function sendNotice(str) {
  $('#noticeDiv').html('<div id="noticeBox" class="float_div alert alert-warning alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p id="noticeText"></p></div>');
  $('#noticeText').html(str);
  $('#noticeBox').fadeIn(300);
}

function cleanNotice() {
  $('#noticeBox').fadeOut(100);
}

function setTime() { //设置按钮倒计时
  if (countdown < 0) {
    document.getElementById('gCode').removeAttribute('disabled');
    document.getElementById('gCode').innerHTML = '获取验证码';
    countdown = 120;
  } else {
    document.getElementById('gCode').setAttribute('disabled', true);
    document.getElementById('gCode').innerHTML = '重新发送(' + countdown + ')';
    countdown--;
    setTimeout(setTime, 1000);
  }
}