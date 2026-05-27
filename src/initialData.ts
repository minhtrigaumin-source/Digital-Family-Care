import { Household, WardInfo, EpidemiologicalAlert } from './types';

export const initialWardInfo: WardInfo = {
  name: "Phường Tân Hưng",
  district: "Quận 7",
  province: "Thành phố Hồ Chí Minh",
  population: 26500,
  healthCenterPhone: "028.3829.1352",
  healthCenterAddress: "Số 2 Hồng Bàng, Phường Tân Hưng, Quận 7, TP. HCM"
};

export const defaultVaccineList = [
  "Lao (BCG)",
  "Bạch hầu - Ho gà - Uốn ván",
  "Sởi - Quai bị - Rubella",
  "Viêm gan B",
  "Viêm não Nhật Bản",
  "Thủy đậu (Varicella)",
  "Phế cầu khuẩn",
  "Cúm mùa (Hàng năm)",
  "COVID-19 (Mũi cơ bản)",
  "COVID-19 (Mũi nhắc lại)"
];

export const initialHouseholds: Household[] = [
  {
    id: "HGĐ-08401",
    headName: "Nguyễn Văn Hùng",
    address: "45/2 Nguyễn Thị Minh Khai",
    phoneNumber: "0908123456",
    quarter: "Khu phố 1",
    neighborhoodGroup: "Tổ dân phố 4",
    createdAt: "2024-01-15",
    members: [
      {
        id: "079085002415",
        fullName: "Nguyễn Văn Hùng",
        relationship: "Chủ hộ",
        gender: "Nam",
        dob: "1968-11-12",
        bloodType: "O+",
        height: 168,
        weight: 75,
        bloodPressureSys: 145,
        bloodPressureDia: 92,
        bloodSugar: 7.2,
        chronicConditions: ["Tăng huyết áp", "Tiền đái tháo đường"],
        vaccines: [
          { name: "Lao (BCG)", status: "fully", dateAdministered: "1968-11-20" },
          { name: "Viêm gan B", status: "fully", dateAdministered: "2015-04-10" },
          { name: "Sởi - Quai bị - Rubella", status: "fully", dateAdministered: "1995-10-15" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully", dateAdministered: "2021-08-11" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "fully", dateAdministered: "2022-03-22" },
          { name: "Cúm mùa (Hàng năm)", status: "none" }
        ],
        lastCheckup: "2026-04-10",
        nextCheckup: "2026-07-10",
        notes: "Có tiền sử bệnh tim mạch nhẹ trong gia đình. Đang dùng thuốc hạ huyết áp nhẹ.",
        riskLevel: "warning",
        metricHistory: [
          { date: "2025-10-01", bloodPressureSys: 140, bloodPressureDia: 90, bloodSugar: 6.8, weight: 76 },
          { date: "2026-01-05", bloodPressureSys: 152, bloodPressureDia: 96, bloodSugar: 7.5, weight: 75 },
          { date: "2026-04-10", bloodPressureSys: 145, bloodPressureDia: 92, bloodSugar: 7.2, weight: 75 }
        ],
        medications: [
          {
            id: "MED-001",
            name: "Amlodipine 5mg",
            dosage: "1 viên",
            frequency: "1 lần/ngày",
            timeOfDay: ["Sáng"],
            status: "active",
            takenDates: ["2026-05-21", "2026-05-22"],
            notes: "Uống sau khi ăn sáng 15 phút. Không uống cùng nước bưởi chùm."
          },
          {
            id: "MED-002",
            name: "Metformin 500mg",
            dosage: "1 viên",
            frequency: "2 lần/ngày",
            timeOfDay: ["Sáng", "Tối"],
            status: "active",
            takenDates: ["2026-05-21"],
            notes: "Uống ngay sau khi ăn để tránh tác dụng phụ chướng bụng đầy hơi."
          }
        ],
        appointments: [
          {
            id: "APP-001",
            date: "2026-06-15",
            time: "08:30",
            facility: "Trạm Y tế Phường Tân Hưng",
            reason: "Tái khám định kỳ tăng huyết áp & đái tháo đường",
            doctorName: "BS. Hoàng Minh Tuấn",
            status: "pending",
            notes: "Nhịn ăn sáng để thực hiện xét nghiệm đường máu chỉ số HbA1c."
          },
          {
            id: "APP-002",
            date: "2026-04-10",
            time: "09:00",
            facility: "Trạm Y tế Phường Tân Hưng",
            reason: "Khám định kỳ & lĩnh thuốc bảo hiểm y tế",
            doctorName: "BS. Hoàng Minh Tuấn",
            status: "completed",
            notes: "Huyết áp bệnh nhân ổn định tốt, dặn dò tiếp tục chế độ ăn ít muối."
          }
        ]
      },
      {
        id: "079172005891",
        fullName: "Lê Thị Lan",
        relationship: "Vợ",
        gender: "Nữ",
        dob: "1972-05-24",
        bloodType: "A+",
        height: 156,
        weight: 54,
        bloodPressureSys: 118,
        bloodPressureDia: 76,
        bloodSugar: 5.1,
        chronicConditions: [],
        vaccines: [
          { name: "Lao (BCG)", status: "fully", dateAdministered: "1972-06-01" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully", dateAdministered: "2021-08-11" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "fully", dateAdministered: "2022-03-25" },
          { name: "Cúm mùa (Hàng năm)", status: "fully", dateAdministered: "2025-11-12" }
        ],
        lastCheckup: "2026-05-02",
        nextCheckup: "2026-11-02",
        notes: "Sức khỏe tốt bình thường. Tập yoga đều đặn.",
        riskLevel: "healthy",
        metricHistory: [
          { date: "2025-11-01", bloodPressureSys: 115, bloodPressureDia: 75, bloodSugar: 5.0, weight: 55 },
          { date: "2026-05-02", bloodPressureSys: 118, bloodPressureDia: 76, bloodSugar: 5.1, weight: 54 }
        ]
      },
      {
        id: "079002012458",
        fullName: "Nguyễn Lê Minh Trí",
        relationship: "Con",
        gender: "Nam",
        dob: "2002-09-18",
        bloodType: "O+",
        height: 175,
        weight: 68,
        bloodPressureSys: 122,
        bloodPressureDia: 80,
        bloodSugar: 4.8,
        chronicConditions: ["Hen suyễn nhẹ"],
        vaccines: [
          { name: "Lao (BCG)", status: "fully", dateAdministered: "2002-09-30" },
          { name: "Viêm gan B", status: "fully", dateAdministered: "2010-05-15" },
          { name: "Sởi - Quai bị - Rubella", status: "fully", dateAdministered: "2008-01-20" },
          { name: "Viêm não Nhật Bản", status: "fully", dateAdministered: "2009-06-12" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully", dateAdministered: "2021-09-15" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "fully", dateAdministered: "2022-04-10" }
        ],
        lastCheckup: "2025-12-15",
        nextCheckup: "2026-06-15",
        notes: "Dị ứng với thời tiết lạnh và bụi bặm gây cơ hen phê quản nhẹ. Cần dự phòng bình xịt xông họng.",
        riskLevel: "healthy",
        metricHistory: [
          { date: "2025-06-15", bloodPressureSys: 120, bloodPressureDia: 78, bloodSugar: 4.6, weight: 67 },
          { date: "2025-12-15", bloodPressureSys: 122, bloodPressureDia: 80, bloodSugar: 4.8, weight: 68 }
        ],
        medications: [
          {
            id: "MED-003",
            name: "Salbutamol Inhaler 100mcg",
            dosage: "1-2 nhát xịt",
            frequency: "Khi có cơn hen",
            timeOfDay: ["Khi cần"],
            status: "active",
            notes: "Xịt họng dự phòng cắt cơn khẩn cấp khi thấy tức ngực, khó thở hoặc khò khè."
          },
          {
            id: "MED-004",
            name: "Singulair (Montelukast) 10mg",
            dosage: "1 viên",
            frequency: "1 lần/ngày",
            timeOfDay: ["Tối"],
            status: "active",
            takenDates: ["2026-05-21", "2026-05-22"],
            notes: "Uống vào buổi tối trước khi đi ngủ để phòng ngừa hen phế quản ban đêm."
          }
        ],
        appointments: [
          {
            id: "APP-003",
            date: "2026-06-15",
            time: "14:00",
            facility: "Trung tâm Y tế Quận 1",
            reason: "Đo hô hấp ký & Kiểm tra kiểm soát hen",
            doctorName: "ThS. BS. Nguyễn Thị Thảo",
            status: "pending",
            notes: "Mang theo bình xịt khí dung đang sử dụng để bác sĩ hướng dẫn lại kỹ thuật xịt."
          }
        ]
      }
    ]
  },
  {
    id: "HGĐ-08402",
    headName: "Trần Minh Đức",
    address: "12 Bis Lê Thánh Tôn",
    phoneNumber: "0913987654",
    quarter: "Khu phố 2",
    neighborhoodGroup: "Tổ dân phố 8",
    createdAt: "2024-03-20",
    members: [
      {
        id: "079061001552",
        fullName: "Trần Minh Đức",
        relationship: "Chủ hộ",
        gender: "Nam",
        dob: "1961-02-14",
        bloodType: "B+",
        height: 165,
        weight: 62,
        bloodPressureSys: 158,
        bloodPressureDia: 99,
        bloodSugar: 9.5,
        chronicConditions: ["Đái tháo đường Tuýp 2", "Tăng huyết áp độ II"],
        vaccines: [
          { name: "Lao (BCG)", status: "fully", dateAdministered: "1961-03-01" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully", dateAdministered: "2021-08-20" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "partial", dateAdministered: "2022-01-05" }
        ],
        lastCheckup: "2026-05-15",
        nextCheckup: "2026-06-15",
        notes: "Huyết áp và đường huyết đều cao chưa ổn định mặc dù có dùng thuốc điều trị. Cần theo dõi sát nguy cơ biến chứng suy thận hoặc xơ vữa.",
        riskLevel: "danger",
        metricHistory: [
          { date: "2025-09-12", bloodPressureSys: 148, bloodPressureDia: 90, bloodSugar: 8.4, weight: 64 },
          { date: "2025-12-10", bloodPressureSys: 155, bloodPressureDia: 95, bloodSugar: 8.9, weight: 63 },
          { date: "2026-03-12", bloodPressureSys: 162, bloodPressureDia: 102, bloodSugar: 10.1, weight: 62 },
          { date: "2026-05-15", bloodPressureSys: 158, bloodPressureDia: 99, bloodSugar: 9.5, weight: 62 }
        ]
      },
      {
        id: "079165005991",
        fullName: "Vũ Thị Thủy",
        relationship: "Vợ",
        gender: "Nữ",
        dob: "1965-08-20",
        bloodType: "AB+",
        height: 152,
        weight: 58,
        bloodPressureSys: 125,
        bloodPressureDia: 80,
        bloodSugar: 5.4,
        chronicConditions: ["Rối loạn lipid máu (mỡ máu)"],
        vaccines: [
          { name: "Lao (BCG)", status: "fully" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "fully" },
          { name: "Cúm mùa (Hàng năm)", status: "fully", dateAdministered: "2025-10-10" }
        ],
        lastCheckup: "2026-05-15",
        nextCheckup: "2026-11-15",
        notes: "Chỉ số Cholesterol toàn phần cao nhẹ (5.8 mmol/L). Đang dùng omega-3 và điều chỉnh chế độ ăn giảm dầu mỡ động vật.",
        riskLevel: "warning",
        metricHistory: [
          { date: "2025-11-15", bloodPressureSys: 121, bloodPressureDia: 78, bloodSugar: 5.2, weight: 59 },
          { date: "2026-05-15", bloodPressureSys: 125, bloodPressureDia: 80, bloodSugar: 5.4, weight: 58 }
        ]
      }
    ]
  },
  {
    id: "HGĐ-08403",
    headName: "Phạm Hồng Phúc",
    address: "78 Nguyễn Du",
    phoneNumber: "0934112233",
    quarter: "Khu phố 1",
    neighborhoodGroup: "Tổ dân phố 3",
    createdAt: "2024-06-10",
    members: [
      {
        id: "079089004812",
        fullName: "Phạm Hồng Phúc",
        relationship: "Chủ hộ",
        gender: "Nam",
        dob: "1989-03-30",
        bloodType: "A+",
        height: 172,
        weight: 85,
        bloodPressureSys: 130,
        bloodPressureDia: 84,
        bloodSugar: 5.6,
        chronicConditions: ["Béo phì độ I"],
        vaccines: [
          { name: "Lao (BCG)", status: "fully" },
          { name: "Viêm gan B", status: "fully" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "fully" }
        ],
        lastCheckup: "2026-02-28",
        nextCheckup: "2026-08-28",
        notes: "BMI = 28.7 (Thừa cân / Béo phì độ I). Gan nhiễm mỡ độ 1. Bác sĩ khuyên tăng cường thể dục 45 phút/ngày và cắt giảm 500 kcal tinh bột.",
        riskLevel: "warning",
        metricHistory: [
          { date: "2025-08-20", bloodPressureSys: 128, bloodPressureDia: 82, bloodSugar: 5.5, weight: 87 },
          { date: "2026-02-28", bloodPressureSys: 130, bloodPressureDia: 84, bloodSugar: 5.6, weight: 85 }
        ]
      },
      {
        id: "079192003310",
        fullName: "Phan Thị Hải Yến",
        relationship: "Vợ",
        gender: "Nữ",
        dob: "1992-12-05",
        bloodType: "B+",
        height: 160,
        weight: 50,
        bloodPressureSys: 110,
        bloodPressureDia: 70,
        bloodSugar: 4.8,
        chronicConditions: [],
        vaccines: [
          { name: "Lao (BCG)", status: "fully" },
          { name: "Viêm gan B", status: "fully" },
          { name: "Sởi - Quai bị - Rubella", status: "fully" },
          { name: "COVID-19 (Mũi cơ bản)", status: "fully" },
          { name: "COVID-19 (Mũi nhắc lại)", status: "fully" }
        ],
        lastCheckup: "2026-04-20",
        nextCheckup: "2026-10-20",
        notes: "Sức khỏe tốt bình thường. Đang lập kế hoạch mang thai nên có chủ động tiêm bổ sung vắc xin gần đây.",
        riskLevel: "healthy",
        metricHistory: [
          { date: "2026-04-20", bloodPressureSys: 110, bloodPressureDia: 70, bloodSugar: 4.8, weight: 50 }
        ]
      },
      {
        id: "079325012589",
        fullName: "Phạm Minh Khang",
        relationship: "Con",
        gender: "Nam",
        dob: "2025-05-15",
        bloodType: "B+",
        height: 78,
        weight: 10.2,
        bloodPressureSys: 90,
        bloodPressureDia: 55,
        bloodSugar: 4.5,
        chronicConditions: [],
        vaccines: [
          { name: "Lao (BCG)", status: "fully", dateAdministered: "2025-05-18" },
          { name: "Viêm gan B", status: "fully", dateAdministered: "2025-05-15" },
          { name: "Bạch hầu - Ho gà - Uốn ván", status: "partial", dateAdministered: "2025-09-20" },
          { name: "Sởi - Quai bị - Rubella", status: "none" }
        ],
        lastCheckup: "2026-05-10",
        nextCheckup: "2026-06-15",
        notes: "Trẻ phát triển hoàn toàn bình thường, cân nặng đạt chuẩn WHO 1 tuổi. Cần chú ý tiêm nhắc lại mũi 5-trong-1 đúng hạn.",
        riskLevel: "healthy",
        metricHistory: [
          { date: "2025-11-15", bloodPressureSys: 85, bloodPressureDia: 50, bloodSugar: 4.3, weight: 8.5 },
          { date: "2026-05-10", bloodPressureSys: 90, bloodPressureDia: 55, bloodSugar: 4.5, weight: 10.2 }
        ]
      }
    ]
  }
];

export const initialAlerts: EpidemiologicalAlert[] = [
  {
    id: "AL-2026-01",
    type: "Sốt xuất huyết",
    location: "Khu phố 1 - Tổ dân phố 4 & 5",
    casesCount: 6,
    riskLevel: "Cao",
    announcementDate: "2026-05-10",
    recommendation: "Yêu cầu các hộ gia đình thực hiện diệt lăng quăng, súc rửa lu khạp đựng nước thường xuyên, dọn dẹp các mảnh sành bể, thả cá lia thia vào bể chứa. Ngủ mùng kể cả ban ngày và xịt thuốc diệt muỗi định kỳ.",
    active: true
  },
  {
    id: "AL-2026-02",
    type: "Tay chân miệng",
    location: "Trường mầm non Tân Hưng (Khu phố 2)",
    casesCount: 3,
    riskLevel: "Trung bình",
    announcementDate: "2026-05-18",
    recommendation: "Yêu cầu vệ sinh sạch sẽ các bề mặt đồ chơi, sàn nhà bằng dung dịch Cloramin B. Thực hiện rửa tay bằng xà phòng cho trẻ thường xuyên, ăn chín uống sôi và không cho trẻ dùng chung ly chén.",
    active: true
  }
];
