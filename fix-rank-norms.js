// Script này được dùng để cập nhật dữ liệu rank_norms trong Firestore
// Mở Firestore Console và chạy script này trong DevTools Console khi đã đăng nhập với tài khoản admin

// Copy đoạn dưới đây và dán vào Console trình duyệt khi đang ở trang web FEMS
// (đã đăng nhập admin)

// Bước 1: Mở tab Application/Storage trong DevTools, hoặc dùng đoạn code dưới
// Bước 2: Copy và paste vào Console:

/*
(async () => {
  const { doc, setDoc, getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const db = getFirestore();
  
  const DEFAULT_RANKS = [
    { rank: 'GS',  rankName: 'Giáo sư',              teachingNorm: 140, researchNorm: 600 },
    { rank: 'PGS', rankName: 'Phó Giáo sư',          teachingNorm: 180, researchNorm: 600 },
    { rank: 'TS',  rankName: 'Tiến sĩ',             teachingNorm: 220, researchNorm: 600 },
    { rank: 'ThS', rankName: 'Thạc sĩ',             teachingNorm: 280, researchNorm: 600 },
    { rank: 'CN',  rankName: 'Cử nhân/Trợ giảng',   teachingNorm: 300, researchNorm: 600 }
  ];
  
  for (const norm of DEFAULT_RANKS) {
    await setDoc(doc(db, 'rank_norms', norm.rank), norm);
    console.log('Updated rank:', norm.rank, '-> teachingNorm:', norm.teachingNorm);
  }
  console.log('✅ All rank_norms updated to 280 (ThS), 220 (TS), 180 (PGS), 140 (GS), 300 (CN)');
  alert('Đã cập nhật xong! Vui lòng reload trang để thấy định mức mới.');
})();
*/

// Hoặc cách đơn giản hơn: Vào Firebase Console > Firestore > collection 'rank_norms'
// Sửa từng document để cập nhật teachingNorm:
//   - GS:  teachingNorm = 140
//   - PGS: teachingNorm = 180
//   - TS:  teachingNorm = 220
//   - ThS: teachingNorm = 280
//   - CN:  teachingNorm = 300

export {};
