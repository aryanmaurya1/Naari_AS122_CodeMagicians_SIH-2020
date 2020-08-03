#include<bits/stdc++.h>
using namespace std;


int main() {
	int arr[7] = {10, 20,50,100, 200, 500,2000 };
	random_device device;
  default_random_engine generator(device());
  uniform_int_distribution<int> distribution(0,6);
	cout << arr[distribution(generator)];
	return 0;
}
