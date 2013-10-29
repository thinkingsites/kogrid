﻿define(["knockout","_"], function (ko,_) {
	var rows = [
		{ "state" : "Washington", "name": "Orr, Kyla N.", "address": "P.O. Box 939, 7880 Dui. Road", "phone": "1-932-653-7795", "age": 47 },
		{ "state" : "Washington", "name": "Combs, Fulton G.", "address": "Ap #870-4013 Facilisi. St.", "phone": "1-986-633-1871", "age": 67 },
		{ "state" : "Washington", "name": "Calhoun, Justine D.", "address": "Ap #184-4677 Ultrices Ave", "phone": "1-409-831-0526", "age": 48 },
		{ "state" : "Washington", "name": "Mccullough, Mercedes F.", "address": "Ap #681-3179 Diam. St.", "phone": "1-434-285-3629", "age": 63 },
		{ "state" : "Washington", "name": "Hanson, Phyllis S.", "address": "P.O. Box 891, 2473 Condimentum. St.", "phone": "1-619-185-2178", "age": 68 },
		{ "state" : "Washington", "name": "Dixon, Alfonso D.", "address": "P.O. Box 152, 7708 Sit Road", "phone": "1-637-311-0830", "age": 64 },
		{ "state" : "Washington", "name": "Newton, Kyle W.", "address": "Ap #120-9147 Purus Ave", "phone": "1-877-679-7247", "age": 42 },
		{ "state" : "Washington", "name": "Gordon, Chaim R.", "address": "858 Porttitor Rd.", "phone": "1-753-729-4140", "age": 71 },
		{ "state" : "Virginia", "name": "Adams, Jescie Q.", "address": "P.O. Box 989, 7189 Nec Ave", "phone": "1-921-753-0127", "age": 78 },
		{ "state" : "Virginia", "name": "Hardy, Fatima O.", "address": "6766 Arcu St.", "phone": "1-501-686-6483", "age": 64 },
		{ "state" : "Virginia", "name": "Boyd, Rowan Q.", "address": "628-5234 Scelerisque St.", "phone": "1-477-170-4275", "age": 31 },
		{ "state" : "Virginia", "name": "Cameron, James D.", "address": "2092 Etiam Ave", "phone": "1-440-718-8780", "age": 30 },
		{ "state" : "Virginia", "name": "Mckay, Joel M.", "address": "Ap #100-4354 Inceptos Road", "phone": "1-122-646-7525", "age": 52 },
		{ "state" : "Virginia", "name": "Tyson, Jasper X.", "address": "P.O. Box 413, 5578 Suspendisse Ave", "phone": "1-826-972-4059", "age": 25 },
		{ "state" : "Virginia", "name": "Wilkerson, Aladdin H.", "address": "Ap #921-3235 Sit Rd.", "phone": "1-218-767-6146", "age": 52 },
		{ "state" : "Virginia", "name": "Kemp, Yetta T.", "address": "861-8428 Ante Road", "phone": "1-548-547-7634", "age": 58 },
		{ "state" : "North Carolina", "name": "Murphy, Melyssa U.", "address": "305-9604 Ac Road", "phone": "1-666-161-8253", "age": 30 },
		{ "state" : "North Carolina", "name": "Romero, Hayes N.", "address": "9643 Tempor Street", "phone": "1-163-529-1044", "age": 52 },
		{ "state" : "North Carolina", "name": "Hull, Nelle C.", "address": "P.O. Box 984, 2075 Lorem St.", "phone": "1-927-331-0833", "age": 71 },
		{ "state" : "North Carolina", "name": "Hensley, Ella N.", "address": "5871 Lobortis Avenue", "phone": "1-180-537-0410", "age": 57 },
		{ "state" : "North Carolina", "name": "Fischer, Azalia O.", "address": "6348 Enim, St.", "phone": "1-294-533-7783", "age": 60 },
		{ "state" : "North Carolina", "name": "Wilson, Lawrence R.", "address": "P.O. Box 789, 7840 Sed, St.", "phone": "1-318-479-6326", "age": 37 },
		{ "state" : "North Carolina", "name": "Sharp, Troy E.", "address": "Ap #721-1336 Nisl. Road", "phone": "1-345-804-5458", "age": 39 },
		{ "state" : "North Carolina", "name": "Berg, Ezra L.", "address": "P.O. Box 248, 390 Sit Road", "phone": "1-646-835-9784", "age": 49 },
		{ "state" : "North Carolina", "name": "Pollard, Yvette Y.", "address": "P.O. Box 102, 1961 Rutrum Rd.", "phone": "1-550-780-2044", "age": 36 },
		{ "state" : "North Carolina", "name": "Anthony, Julie Q.", "address": "P.O. Box 747, 7976 Phasellus Av.", "phone": "1-752-250-1061", "age": 29 },
		{ "state" : "Oregon", "name": "Mullins, Rosalyn P.", "address": "899-6359 Ut Road", "phone": "1-530-780-3093", "age": 68 },
		{ "state" : "Oregon", "name": "Caldwell, Neve J.", "address": "9980 Feugiat. Road", "phone": "1-596-604-2627", "age": 31 },
		{ "state" : "Oregon", "name": "Goff, Caleb P.", "address": "434-5151 Donec Road", "phone": "1-644-121-1514", "age": 51 },
		{ "state" : "Oregon", "name": "Wilkinson, Bertha M.", "address": "Ap #248-9130 Primis Rd.", "phone": "1-246-359-9031", "age": 50 },
		{ "state" : "Oregon", "name": "Shepherd, Teagan W.", "address": "P.O. Box 494, 9857 Sollicitudin Av.", "phone": "1-654-264-5301", "age": 54 },
		{ "state" : "Oregon", "name": "Frazier, Xena Y.", "address": "Ap #612-5176 Nullam Rd.", "phone": "1-697-185-9130", "age": 59 },
		{ "state" : "Oregon", "name": "Norton, Hanna E.", "address": "2995 Et Av.", "phone": "1-413-573-8694", "age": 36 },
		{ "state" : "Texas", "name": "Webster, Jolene V.", "address": "3224 Tellus Rd.", "phone": "1-284-681-9528", "age": 43 },
		{ "state" : "Texas", "name": "Byrd, Basia S.", "address": "P.O. Box 981, 8041 Mauris Rd.", "phone": "1-167-582-4661", "age": 54 },
		{ "state" : "Texas", "name": "Glass, Yeo I.", "address": "P.O. Box 637, 9376 Sit Avenue", "phone": "1-787-199-7239", "age": 37 },
		{ "state" : "Texas", "name": "Benjamin, Charde W.", "address": "Ap #204-513 In Rd.", "phone": "1-471-975-2244", "age": 71 },
		{ "state" : "Texas", "name": "Carrillo, Hillary S.", "address": "Ap #171-9212 Ante St.", "phone": "1-949-269-0557", "age": 62 },
		{ "state" : "Texas", "name": "Burgess, Leigh L.", "address": "P.O. Box 347, 2969 Vitae St.", "phone": "1-477-318-9306", "age": 47 },
		{ "state" : "Texas", "name": "Mcfadden, Yen W.", "address": "Ap #869-7563 Eget Ave", "phone": "1-134-796-1763", "age": 25 }
	]
	rows = _(rows).groupBy('state').value();
	
	console.info(rows);
	
    var viewmodel = {
        rows : rows,
        height: "300px",
        columns: ko.observableArray([
			{ title: "Name", key: "name" },
			{ title: "Address", key: "address" },
			{ title: "Phone", key: "phone" },
			{ title: "Age", key: "age", style: { width: "50px", "text-align": "center" } }
		])
    };

    return viewmodel;
});